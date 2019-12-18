pipeline {
    agent any
    stages {
        stage('Installing dependencies...') {
            steps {
                sh 'yarn install'
            }
        }

        stage('Running tests...') {
            steps {
                sh 'yarn test'
            }
        }

        stage('Uploading to CDN...') {
            steps {
              sh 'yarn upload'
            }
        }
    }

    post {
      // Always runs. And it runs before any of the other post conditions.
      always {
        // Let's wipe out the workspace before we finish!
        deleteDir()
      }

      success {
        slackSend channel: '#crew-brucke-feed',
                  color: 'good',
                  message: "Upload of ${currentBuild.fullDisplayName} completed successfully."
      }

      failure {
        slackSend channel: '#crew-brucke-feed',
                  color: 'error',
                  message: "Upload of ${currentBuild.fullDisplayName} has failed."

      }
    }

    // The options directive is for configuration that applies to the whole job.
    options {
      // For example, we'd like to make sure we only keep 10 builds at a time, so
      // we don't fill up our storage!
      buildDiscarder(logRotator(numToKeepStr:'10'))

      // And we'd really like to be sure that this build doesn't hang forever, so
      // let's time it out after an hour.
      timeout(time: 60, unit: 'MINUTES')
    }
}
