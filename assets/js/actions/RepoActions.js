/*
  @author Sam Heutmaker [samheutmaker@gmail.com]
*/

import Reducers from './../reducers/AddRepoReducers'
import * as GA from './../reducers/GeneralReducers'
import * as RAjax from './../util/RAjax'
import Validate from './../util/Validate'
import NPECheck from './../util/NPECheck'
import {
  notifState,
  isAddNotificationValid
} from './NotificationActions'

import {
  newRegistryState
} from './RegistryActions'

// *************************************************
// General Repo Actions
// *************************************************

export function listRepos() {
  return new Promise((resolve, reject) => {
    this.setState({
      reposXHR: (this.state.repos.length) ? false : true
    }, () => {
      RAjax.GET.call(this, 'ListContainerRepos', {})
        .then((res) => {

          let reposMap = res.reduce((cur, repo) => {
            cur[repo.id] = repo
            return cur;
          }, {});

          this.setState({
            repos: res,
            reposMap: reposMap,
            reposXHR: false
          }, () => resolve());
        })
        .catch((err) => {
          this.setState({
            reposXHR: false
          }, () => reject());
        });
    });
  });
}

export function filterRepos(e, eIsValue) {
  let value = (eIsValue) ? e : e.target.value;

  this.setState({
    reposFilterQuery: value
  });
}


// *************************************************
// Add Repo Actions
// *************************************************

export function addRepoState() {
  return {
    errorMsg: '',
    errorFields: [],
    validateOnInput: false,
    newRepoCredsType: 'EXISTING',
    success: null,
    XHR: false,
    selectExistingCredentialsDropdown: false,
    selectRepoDropdown: false,
    reposInRegistryXHR: false,
    reposInRegistry: [],
    reposInRegistryQuery: '',
    newRepo: {
      repo: {
        credId: '',
        name: ''
      }
    },
    createLocalName: '',
    createLocalXHR: false,
    createLocalError: ''
  };
}

export function resetAddRepoState() {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, addRepoState.call(this))
  });
}

export function updateNewLocalRepoName(e, eIsValue = false) {
  let value = (eIsValue) ? e : e.target.value;
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      createLocalName: value,
      createLocalError: ''
    })
  });
}

export function clearCreateLocalRepoErrors() {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      createLocalError: ''
    })
  });
}

export function createLocalRepo() {
  return new Promise((resolve, reject) => {

    let repoName = NPECheck(this.state, 'addRepo/createLocalName', '');

    if (!repoName) {
      this.setState({
        addRepo: GA.modifyProperty(this.state.addRepo, {
          createLocalError: 'Invalid repository name.'
        })
      }, () => reject());
      return;
    }

    this.setState({
      addRepo: GA.modifyProperty(this.state.addRepo, {
        createLocalXHR: true
      })
    }, () => {

      RAjax.POST.call(this, 'CreateLocalRepo', {}, {
          repoName
        })
        .then((res) => {
          this.setState({
            addRepo: GA.modifyProperty(this.state.addRepo, {
              createLocalXHR: false
            })
          }, () => resolve());
        })
        .catch((err) => {
          console.error(err);
          let errorMsg = `There was an error creating your repository: ${err.error.message}`
          this.setState({
            addRepo: GA.modifyProperty(this.state.addRepo, {
              createLocalXHR: false,
              createLocalError: errorMsg
            })
          }, () => reject());
        });
    });
  });
}

export function updateNewRepoField(keyPath, e, eIsValue = false) {
  let value = (eIsValue) ? e : e.target.value;

  this.setState({
    addRepo: Reducers(this.state.addRepo, {
      type: 'UPDATE_NEW_REPO',
      data: {
        keyPath,
        value
      }
    })
  }, () => {
    if (this.state.addRepo.validateOnInput) isAddRepoValid.call(this, true);
    if (keyPath == 'repo/credId') listReposForRegistry.call(this);
  })
};

export function resetCurrentRepoSearch() {
  return new Promise((resolve, reject) => {
    this.setState({
      addRepo: GA.modifyProperty(this.state.addRepo, {
        reposInRegistry: [],
        reposInRegistryQuery: '',
        newRepo: {
          repo: {
            ...this.state.addRepo.newRepo.repo,
            name: ''
          }
        }
      })
    }, () => resolve());
  });
}

export function listReposForRegistry() {
  let credId = NPECheck(this.state.addRepo, 'newRepo/repo/credId', null);
  let registry = (this.state.addRepo.newRepoCredsType == 'EXISTING') ? this.state.registriesMap[credId] : this.state.addRegistry.newRegistry

  let registriesWithRepos = ['GCR', 'ECR', 'DOCKERHUB'];

  if (registry && registriesWithRepos.includes(registry.provider)) {
    this.setState({
      addRepo: GA.modifyProperty(this.state.addRepo, {
        reposInRegistryXHR: true,
        reposInRegistryQuery: '',
      })
    }, () => {
      RAjax.POST.call(this, 'ListReposInRegistry', {}, credId ? {
          credId
        } : registry)
        .then((res) => {
          this.setState({
            addRepo: GA.modifyProperty(this.state.addRepo, {
              reposInRegistry: res,
              reposInRegistryXHR: false,
            })
          });
        })
        .catch((err) => {
          this.setState({
            addRepo: GA.modifyProperty(this.state.addRepo, {
              reposInRegistry: [],
              errorMsg: 'Unable to list repositories for selected registry',
              reposInRegistryXHR: false,
            })
          });
        });
    });
  } else {
    this.setState({
      addRepo: GA.modifyProperty(this.state.addRepo, {
        reposInRegistry: [],
      })
    });
  }
}

export function updateReposInRegisterQuery(e, eIsValue) {
  let value = (eIsValue) ? e : e.target.value;

  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      reposInRegistryQuery: value
    })
  });
}

export function toggleSelectRepoDropdown() {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      selectRepoDropdown: !this.state.addRepo.selectRepoDropdown
    })
  });
}

export function setNewRepoCredsType(type) {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      ...addRepoState.call(this),
      newRepoCredsType: type,
    }),
    addRegistry: GA.modifyProperty(this.state.addRegistry, {
      errorFields: [],
      errorMsg: '',
      newRegistry: newRegistryState.call(this)
    })
  });
}

export function selectCredsForNewRepo(e, value) {
  let id;

  if (e) {
    id = JSON.parse(e.target.value).id
  } else if (value) {
    id = value
  }

  updateNewRepoField.call(this, 'repo/credId', id, true);
}

export function toggleSelectExistingCredsDropdown() {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      selectExistingCredentialsDropdown: !this.state.addRepo.selectExistingCredentialsDropdown
    })
  });
}

export function addRepoRequest(afterAddCb) {
  if (!isAddRepoValid.call(this, true)) return;

  let postData = {
    repo: this.state.addRepo.newRepo.repo,
  };

  let notif = NPECheck(this.state, 'notif/newNotification', {});

  let shouldIncludeNotif = Object.keys(notif)
    .reduce((cur, next) => {
      cur = (!!notif[next]) ? cur + 1 : cur
      return cur;
    }, 0) > 1;

  if (shouldIncludeNotif) {
    if (!isAddNotificationValid.call(this)) return;

    postData.notification = notif;
  }

  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      XHR: true
    })
  }, () => {

    RAjax.POST.call(this, 'SaveContainerRepo', postData)
      .then((res) => {
        this.setState({
          addRepo: GA.modifyProperty(this.state.addRepo, {
            XHR: false,
            success: true,
          }),
          notif: notifState.call(this)
        }, () => {
          listRepos.call(this)

          if (afterAddCb) afterAddCb(res.id);
        })
      })
      .catch((err) => {
        console.error(err);
        let errorMsg = `There was an error adding your repository: ${err.error.message}`
        this.setState({
          addRepo: GA.modifyProperty(this.state.addRepo, {
            XHR: false,
            success: false,
            errorMsg,
          })
        })
      });
  });
}

export function clearAddRepoSuccess() {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      success: null
    })
  });
}

export function canAddRepo() {
  return this.state.addRepo.errorMsg == '' && this.state.addRegistry.errorFields.length == 0;
}


export function clearAddRepoError() {
  this.setState({
    addRepo: GA.modifyProperty(this.state.addRepo, {
      errorMsg: '',
      errorFields: [],
      validateOnInput: false
    })
  });
}

function isAddRepoValid(validateOnInput) {

  let required = {
    repo: {
      credId: 'Registry Provider',
      name: 'Docker Repository'
    }
  };

  let errorFields = Validate.call(this, this.state.addRepo.newRepo, required);

  if (errorFields.names.length) {
    let errorMsg = `Missing required fields: ${errorFields.names.join(', ')}`;
    this.setState({
      addRepo: GA.modifyProperty(this.state.addRepo, {
        errorMsg,
        validateOnInput,
        errorFields: errorFields.keys,
      })
    });
    return false
  } else {
    this.setState({
      addRepo: GA.modifyProperty(this.state.addRepo, {
        errorMsg: '',
        errorFields: []
      })
    });
    return true
  }
}

// *************************************************
// Repo Detail Actions
// *************************************************


export function repoDetailsState() {
  return {
    activeRepo: {},
    repoOverviewContent: '',
    repoOverviewContentOriginal: '',
    isOverviewModified: false,
    editOverview: false,
    repoOverviewError: '',
    pageXHR: false,
    deleteXHR: false,
    isDeleting: false,
    showSettings: false,
    events: [],
    eventsXHR: false,
    eventsError: '',
    manifests: [],
    manifestsXHR: false,
    manifestsError: '',
    timelineSection: 'OVERVIEW',
    activeEventId: null,
  };
}

export function resetRepoDetailsState() {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.addRepo, repoDetailsState.call(this))
  });
}

export function toggleRepoDetailsPageXHR(loading) {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      pageXHR: loading
    })
  });
}

export function setActiveRepoDetails(repoId) {
  return new Promise((resolve, reject) => {
    let repo = this.state.reposMap[repoId];

    this.setState({
      repoDetails: GA.modifyProperty(this.state.repoDetails, {
        activeRepo: repo
      })
    }, () => resolve());
  });
}

export function getRepoOverview(repoId) {
  return new Promise((resolve, reject) => {
    if (!repoId) repoId = NPECheck(this.state, 'repoDetails/activeRepo/id', '');

    this.setState({
      repoDetails: GA.modifyProperty(this.state.repoDetails, {})
    }, () => {
      RAjax.GET.call(this, 'GetRepoOverview', {
          repoId
        })
        .then((res) => {

          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              repoOverviewContent: res.content || '',
              repoOverviewContentOriginal: res.content || '',
              isOverviewModified: false
            })
          }, () => resolve());

        })
        .catch((err) => {
          console.error(err);
          reject();
        });
    })
  });
}

export function updateRepoOverviewContent(e, eIsValue = false) {
  let value = (eIsValue) ? e : e.target.value;
  let ogValue = NPECheck(this.state, 'repoDetails/repoOverviewContentOriginal', '');

  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      repoOverviewContent: value,
      isOverviewModified: value != ogValue
    })
  });
}

export function toggleRepoOverviewEdit() {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      editOverview: !this.state.repoDetails.editOverview
    })
  });
}

export function saveRepoOverview() {
  return new Promise((resolve, reject) => {
    this.setState({
      repoDetails: GA.modifyProperty(this.state.repoDetails, {
        saveRepoOverviewXHR: true
      })
    }, () => {
      let content = this.state.repoDetails.repoOverviewContent;
      let repoId = this.state.repoDetails.activeRepo.id;
      RAjax.POST.call(this, 'SaveRepoOverview', {
          content
        }, {
          repoId
        })
        .then((res) => {

          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              saveRepoOverviewXHR: false,
              editOverview: false
            })
          }, () => resolve());

        })
        .catch((err) => {
          console.error(err);
          let errorMsg = `There was an error saving your read me. ${NPECheck(err, 'error/message', '')}`
          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              saveRepoOverviewXHR: false,
              repoOverviewError: errorMsg
            })
          }, () => reject());

        });
    });
  });
}

export function discardRepoOverviewChanges() {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      repoOverviewContent: this.state.repoDetails.repoOverviewContentOriginal,
      isOverviewModified: false,
      editOverview: false
    })
  });
}


export function toggleActiveRepoDelete() {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      isDeleting: !this.state.repoDetails.isDeleting
    })
  })
}

export function deleteActiveRepo(afterDeleteCb) {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      deleteXHR: true
    })
  }, () => {
    RAjax.POST.call(this, 'DeleteContainerRepo', {}, {
        id: this.state.repoDetails.activeRepo.id
      })
      .then((res) => {
        this.setState({
          repoDetails: GA.modifyProperty(this.state.repoDetails, {
            deleteXHR: false
          })
        }, () => {
          if (afterDeleteCb) afterDeleteCb();
        });
      })
      .catch((err) => {
        this.setState({
          repoDetails: GA.modifyProperty(this.state.repoDetails, {
            deleteXHR: false
          })
        });
      });
  });
}

export function toggleActiveRepoSettings() {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      showSettings: !this.state.repoDetails.showSettings
    })
  })
}

export function setTimelineSection(section = '') {
  this.setState({
    repoDetails: GA.modifyProperty(this.state.repoDetails, {
      timelineSection: section
    })
  });
}

export function listRepoEvents(repoId, skipXHR) {
  return new Promise((resolve, reject) => {
    this.setState({
      repoDetails: GA.modifyProperty(this.state.repoDetails, {
        eventsXHR: (skipXHR) ? false : true
      })
    }, () => {
      RAjax.GET.call(this, 'ListRepoEvents', {
          repoId
        })
        .then((res) => {
          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              events: res,
              eventsXHR: false
            })
          }, () => resolve());
        })
        .catch((err) => {
          console.error(err);
          let errorMsg = `There was an error retrieving your events for this repository. ${NPECheck(err, 'error/message', '')}`
          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              eventsXHR: false,
              eventsError: errorMsg
            })
          }, () => reject());
        })
    })
  });
}

export function toggleEventDetails(eventId = null) {
  return new Promise((resolve, reject) => {
    this.setState({
      repoDetails: GA.modifyProperty(this.state.repoDetails, {
        activeEventId: (this.state.repoDetails.activeEventId == eventId) ? null : eventId
      })
    }, () => resolve(!!this.state.repoDetails.activeEventId));
  });
}


export function listRepoManifests(repoId) {
  return new Promise((resolve, reject) => {
    this.setState({
      repoDetails: GA.modifyProperty(this.state.repoDetails, {
        manifestsXHR: true
      })
    }, () => {
      RAjax.GET.call(this, 'ListRepoManifests', {
          repoId
        })
        .then((res) => {
          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              manifests: res,
              manifestsXHR: false,
              manifestsError: ''
            })
          }, () => resolve())
        })
        .catch((err) => {
          console.error(err);
          let errorMsg = NPECheck(err, 'error/message', 'There was an error listing your repoistory tags.');
          this.setState({
            repoDetails: GA.modifyProperty(this.state.repoDetails, {
              manifestsXHR: false,
              manifestsError: errorMsg
            })
          }, () => reject())

        });
    });
  });
}
