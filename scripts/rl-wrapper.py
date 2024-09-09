#!/usr/bin/env python3

import argparse
import json
import os
import shutil
import sys
import tempfile
import zipfile
import subprocess
from datetime import datetime

if sys.version_info < (3, 8):
    sys.exit('Python 3.8+ is required')

# We expect these libraries to be present, but they're not part of core python.
# Fail with an error if they can't be loaded.
try:
    import requests
    import boto3
    from botocore.exceptions import NoCredentialsError, ClientError
except ModuleNotFoundError as e:
    sys.exit(f'[x] Failed to load required dependency {e.name}')

def parse_arguments():
    DESCRIPTION='''rl-wrapper is a wrapper the Reversing Labs CLI tool rl-secure.
It scans the target artifact, generates a report, and fails if the report
indicates the presence of malware in the target.'''

    EPILOG='''This tool also requires the environment variables SIGNAL_HANDLER_TOKEN, RLSECURE_SITE_KEY, and RLSECURE_LICENSE containing a valid signal handler token, rl-secure site key, and license key respectively.'''

    parser = argparse.ArgumentParser(description=DESCRIPTION, epilog=EPILOG)
    parser.add_argument('-a', '--artifact', required=True, help='Path to artifact')
    parser.add_argument('-n', '--name', required=True, help='Artifact name')
    parser.add_argument('-v', '--version', required=True, help='Artifact version')
    parser.add_argument('-r', '--repository', required=True, help='Repository Name (org/repo)')
    parser.add_argument('-c', '--commit', required=True, help='Commit Hash')
    parser.add_argument('-b', '--build-env', required=True, help='Build System (e.g CirlceCI, Bacon etc..)')
    # TODO: collect build-url for traceability
    return parser.parse_args()

def create_workdir():
    workdir = tempfile.mkdtemp()
    try:
        os.chdir(workdir)
    except Exception as e:
        sys.exit(f'[x] Error changing to work directory: {e}')
    return workdir

def create_dir(file_path):
    # Create the directory if it doesn't exist
    os.makedirs(file_path, exist_ok=True)

def generate_timestamp():
    return datetime.now().strftime('%Y%m%dT%H%M%S.%fZ')

def generate_targetdir(artifact_name, artifact_version, timestamp):
    return ''.join(
        c if c.isalnum() or c in '_.-' else '_' for c in f'{artifact_name}-{artifact_version}-{timestamp}'
    )

def install_rlsecure(workdir, license_key, site_key):
    try:
        if not shutil.which('rl-deploy'):
            subprocess.run(['pip', 'install', 'rl-deploy'], check=True)
        subprocess.run(['rl-deploy', 'install', f'{workdir}/reversinglabs/', f'--encoded-key={license_key}', f'--site-key={site_key}', '--no-tracking'], check=True)
    except subprocess.CalledProcessError as e:
        print(f'[x] Error: {e.stderr}', file=sys.stderr)
        sys.exit(f'[x] Failed to install rl-secure: {e}')

def initialize_filestore(rlsecure_path, workdir):
    try:
        subprocess.run([rlsecure_path, 'init', f'--rl-store={workdir}/filestore/'], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(f'[x] Failed to initialize filestore: {e}')

def scan_artifact(rlsecure_path, artifact, workdir, artifact_name, artifact_version):
    try:
        subprocess.run([rlsecure_path, 'scan', artifact, '-s', f'{workdir}/filestore/', f'pkg:rl/pipeline/{artifact_name}@{artifact_version}'], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(f'[x] Failed to scan artifact: {e}')

def generate_report(rlsecure_path, workdir, targetdir, artifact_name, artifact_version):
    try:
        subprocess.run([rlsecure_path, 'report', 'rl-html,rl-json', '-s', f'{workdir}/filestore/', f'pkg:rl/pipeline/{artifact_name}@{artifact_version}', '--output-path', f'{workdir}/{targetdir}'], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(f'[x] Failed to generate report: {e}')

def detect_malware(report_file):
    report_data = load_report(report_file)
    try:
        report_metadata = report_data['report']['metadata']
        malware_violation_rule_ids = MALWARE_VIOLATION_IDS

        is_malware_detected = process_violations(report_metadata, malware_violation_rule_ids)

        if not is_malware_detected:
            print('[i] No Malware was detected.')
    except KeyError:
        handle_key_error()

    return is_malware_detected

def load_report(report_file):
    try:
        with open(report_file) as file:
            return json.load(file)
    except Exception:
        sys.exit(f'[x] Error reading report data from {report_file}')

def process_violations(report_metadata, malware_violation_rule_ids):
    print('----------------- Detections -----------------', file=sys.stderr)
    is_malware_detected = False

    if violations := report_metadata['violations']:
        for _, violation in violations.items():
            if violation['rule_id'] in malware_violation_rule_ids: # Malware was detected
                is_malware_detected = True
                for component_id in violation['references']['component']:
                    print(f'[!] {violation["rule_id"]}: {violation["description"]} -> {report_metadata["components"][component_id]["path"]}', file=sys.stderr)
                    report_malware_detection(violation['rule_id'])

    return is_malware_detected

def report_malware_detection(rule_id):
    print(f'\t* More information on the detections can be found at: https://docs.secure.software/policies/malware/{rule_id}', file=sys.stderr)

def handle_key_error():
    _, _, traceback = sys.exc_info()
    sys.exit(f'[x] Inconsistency in report JSON at {traceback.tb_frame.f_code.co_filename}:{traceback.tb_lineno}')

def compress_folder(folder_path, output_name=None, output_path=None, ignore_patterns=['.git']):
    if not os.path.isdir(folder_path):
        raise ValueError(f'The provided path "{folder_path}" is not a valid directory.')

    ignore_patterns = ignore_patterns or []

    # Determine the name of the output .zip file
    folder_name = os.path.basename(os.path.normpath(folder_path))
    zip_filename = f'{folder_name}.zip' if output_name is None else f'{output_name}.zip'

    if output_path:
        zip_filepath = os.path.join(output_path, zip_filename)
    else:
        zip_filepath = os.path.join(os.path.dirname(folder_path), zip_filename)

    # Create the zip file
    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(folder_path):
            dirs[:] = [d for d in dirs if not any(os.path.join(root, d).startswith(os.path.join(folder_path, pattern)) for pattern in ignore_patterns)]

            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, folder_path)
                zip_file.write(file_path, arcname)

    return zip_filepath

def upload_to_s3(file_path, s3_bucket_name, s3_key):
    s3 = boto3.client('s3')
    try:
        s3.upload_file(file_path, s3_bucket_name, s3_key)
        print(f'[i] S3 - Uploaded {file_path} to s3://{s3_bucket_name}/{s3_key}')
        return
    except FileNotFoundError:
        sys.exit(f'[x] S3 - The file {file_path} was not found.')
    except NoCredentialsError:
        sys.exit('[x] S3 - Credentials not available.')
    except ClientError as e:
        sys.exit(f'[x] S3 - Failed to upload {file_path} to S3: {e}.')

def submit_to_s3(workdir, targetdir, s3_bucket_name, tool_name, artifact_name, artifact_version, timestamp):
    print('---------------------------------------------')
    s3_results_path = f'{tool_name}/{artifact_name}/{artifact_version}/{timestamp}'

    rl_html_path = f'{workdir}/{targetdir}/rl-html'
    rl_json_path = f'{workdir}/{targetdir}/report.rl.json'

    # compress rl-html directory
    rl_html_path = compress_folder(rl_html_path)

    upload_to_s3(rl_html_path, s3_bucket_name, f'{s3_results_path}/rl-html.zip')
    upload_to_s3(rl_json_path, s3_bucket_name, f'{s3_results_path}/report.rl.json')

    return s3_results_path

def submit_to_scan_log(payload):
    print('---------------------------------------------')
    endpoint = 'https://signal-handler.oktasecurity.com/scan'
    headers = {
        'x-api-key': SIGNAL_HANDLER_TOKEN,
        'Content-Type': 'application/json'
    }

    try:
        response = requests.put(endpoint, headers=headers, json=payload, timeout=60)
        response.raise_for_status()  # Raise an error for bad status codes
        print(f'[i] ScanLog - Request successful: {response.status_code}')
        return response
    except requests.exceptions.RequestException as e:
        sys.exit(f'[x] ScanLog - Request failed: {e}')

def main():
    args = parse_arguments()

    if not SIGNAL_HANDLER_TOKEN:
        sys.exit('[x] Missing SIGNAL_HANDLER_TOKEN.')

    if not (RLSECURE_SITE_KEY or RLSECURE_LICENSE):
        sys.exit('[x] Missing RLSECURE_SITE_KEY and/or RLSECURE_LICENSE.')

    print(f'''Artifact: {args.artifact}\nName: {args.name}\nVersion: {args.version}\n----------------- Execution -----------------''')

    workdir = create_workdir()
    timestamp = generate_timestamp()
    targetdir = generate_targetdir(args.name, args.version, timestamp)

    # We expect rl-secure to be present
    rlsecure_path = shutil.which('rl-secure')

    # Bail out earily if artifact can't be found
    if not os.path.exists(args.artifact):
        sys.exit(f'[x] Aritfact: "{args.artifact}" can not be found.')

    if os.path.isdir(args.artifact): # if a directory is passed package it and compress it for scanning
        artifact_package = f'{args.name}-{args.version}'
        print(f'[i] Artifact Path is a directory - packaging: \"{artifact_package}.zip\"')
        create_dir(f'{workdir}/{targetdir}')
        args.artifact = compress_folder(args.artifact, output_name=artifact_package, output_path=f'{workdir}/{targetdir}')

    if not rlsecure_path:
        print('[i] "rl-secure" not found, installing.')
        install_rlsecure(workdir, RLSECURE_LICENSE, RLSECURE_SITE_KEY)
        rlsecure_path = f'{workdir}/reversinglabs/rl-secure'

    initialize_filestore(rlsecure_path, workdir)
    scan_artifact(rlsecure_path, args.artifact, workdir, args.name, args.version)
    generate_report(rlsecure_path, workdir, targetdir, args.name, args.version)

    is_non_compliant_violations = detect_malware(f'{workdir}/{targetdir}/report.rl.json')

    s3_results_path = submit_to_s3(workdir, targetdir, s3_bucket_name, tool_name, args.name, args.version, timestamp)

    payload = { # Pass these in as arguments
        'repository_name': f'{args.repository}',
        'project_name': f'{args.name}',
        'commit_hash': f'{args.commit}',
        'project_version': f'{args.version}',
        'type': 'malware',
        'source': 'eng',
        'build-system': f'{args.build_env}',
        'results_link': f's3://{s3_results_path}/report.rl.json',
        'scanner': f'{tool_name}'
    }

    submit_to_scan_log(payload=payload)

    if is_non_compliant_violations:
        sys.exit(1)

if __name__ == '__main__':
    print('''
         __
   _____/ /    _      ___________ _____  ____  ___  _____
  / ___/ /____| | /| / / ___/ __ `/ __ \\/ __ \\/ _ \\/ ___/
 / /  / /_____/ |/ |/ / /  / /_/ / /_/ / /_/ /  __/ /
/_/  /_/      |__/|__/_/   \\__,_/ .___/ .___/\\___/_/.py
                               /_/   /_/
(Reversing Labs)''')
    MALWARE_VIOLATION_IDS = ['SQ30104', 'SQ30106', 'SQ30109', 'SQ30110']

    # Check required environment variables
    s3_bucket_name = 'prodsec-tool-scans-test'
    tool_name = 'reversinglabs'

    SIGNAL_HANDLER_TOKEN = os.getenv('SIGNAL_HANDLER_TOKEN')
    RLSECURE_SITE_KEY = os.getenv('RLSECURE_SITE_KEY')
    RLSECURE_LICENSE = os.getenv('RLSECURE_LICENSE')

    main()
