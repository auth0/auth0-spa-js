import { default as load } from '@commitlint/load';
import { default as lint } from '@commitlint/lint';
import { default as format } from '@commitlint/format';
import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    // 1. Get the pull request title
    const prTitle = github.context.payload.pull_request?.title;

    if (!prTitle) {
      core.setFailed('⛔️ Could not get pull request title. This action should only be run on a pull_request event.');
      return;
    }

    core.info(`📝 Validating PR Title: "${prTitle}"`);

    // 2. Load the commitlint configuration from the repository
    const config = await load({}, { file: 'commitlint.config.mjs', cwd: process.cwd() });

    if (!config.rules || Object.keys(config.rules).length === 0) {
      core.setFailed('⛔️ No commitlint rules loaded. Is commitlint.config.mjs present at the repo root?');
      return;
    }

    core.info('✅ Loaded commitlint configuration successfully.');

    // 3. Lint the pull request title
    const result = await lint(prTitle, config.rules, {
      defaultIgnores: config.defaultIgnores,
      helpUrl: config.helpUrl,
    });

    // 4. Report the results
    if (result.valid) {
      core.info('✅ PR title is valid.');
    } else {
      const errors = format({ results: [result] }, { color: false }).trimEnd();
      const validTypes = config.rules['type-enum']?.[2]?.join(', ');
      const sep = '─'.repeat(49);
      const details = [
        errors,
        '',
        sep,
        ' Expected format:  <type>(<optional scope>): <subject>',
        ...(validTypes ? ['', ` Valid types:  ${validTypes}`] : []),
        '',
        ' Examples:',
        '   feat: add login with passkeys',
        '   fix(cache): correct token expiry edge case',
        '   ci: add PR title linting',
        '',
        ' Learn more: https://www.conventionalcommits.org',
        sep,
      ].join('\n');
      core.info(details);
      core.setFailed(`PR title "${prTitle}" does not follow the Conventional Commits format.`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`⛔️ Action failed with error: ${error.message}`);
    } else {
      core.setFailed('⛔️ An unknown error occurred.');
    }
  }
}

run();
