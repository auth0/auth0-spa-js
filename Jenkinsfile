@Library('auth0-pipeline') _

pipeline {
  agent {
    kubernetes {
      yaml defaultAgent()
    }
  }

  tools {
    nodejs '14.16.1'
  }

  options {
    timeout(time: 10, unit: 'MINUTES')
  }

  stages {
    stage('Install & Build') {
      steps {
        sshagent(['auth0extensions-ssh-key']) {
          sh 'make install'
          sh 'make build'
        }
      }
    }
    stage('Test') {
      steps {
        script {
          try {
            sh 'make test'
            githubNotify context: 'jenkinsfile/auth0/tests', description: 'Tests passed', status: 'SUCCESS'
          } catch (error) {
            githubNotify context: 'jenkinsfile/auth0/tests', description: 'Tests failed', status: 'FAILURE'
            throw error
          }
        }
      }
    }
    stage('Publish to CDN') {
      when {
        anyOf {
          branch 'beta'
          branch 'main'
        }
      }
      steps {
        CdnPublish()
      }
    }
  }

  post {
    cleanup {
      deleteDir()
    }
  }
}
