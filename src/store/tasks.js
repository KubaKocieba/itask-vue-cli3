import firebaseConfig from "../firebaseConfig";
import axios from "axios";
import store from "./store";
import Vue from "vue";

const db = axios.create({
  baseURL: firebaseConfig.databaseURL
});

const state = {
  tasks: {},
  tabs: {},
  tabData: {},
  loaded: false,
  activeTab: 0
};

const getters = {
  tabData: state => {
    return state.tabData;
  },
  tabs: state => {
    return state.tabs;
  },
  tasks: state => {
    return state.tasks;
  },
  tasksLoaded: state => {
    return state.loaded;
  },
  activeTab: state => {
    return state.activeTab;
  }
};

const mutations = {
  resetData(state) {
    state.tasks = {};
    state.loaded = false;
  },
  newTab(state) {
    var userId = store.getters.user.userId,
      tabInit = {
        name: "New tab",
        tasks: [{ init: true }]
      };

    state.loaded = false;

    db.post(
      "users/" + userId + "/tabs.json?auth=" + store.getters.user.idToken,
      tabInit
    ).then(resp => {
      store.dispatch("fetchTabs");
      localStorage.setItem("activeTab", resp.data.name);
      state.activeTab = resp.data.name;
      store.dispatch("fetchList", resp.data.name);
    });
  },
  editTabName(state, tab) {
    var userId = store.getters.user.userId;

    const { name, key } = tab;

    state.tabData.tabs[key].name = name;
    state.tabs[key].name = name;

    db.patch(
      "users/" +
        userId +
        "/tabs/" +
        key +
        ".json?auth=" +
        store.getters.user.idToken,
      { name }
    ).then(resp => {
      //Vue.set(state.tabs, 'tab' + Object.keys(state.tabs).length, tabInit);
      document.activeElement.blur();
      //localStorage.setItem('activeTab', tab.key);
    });
  },
  getTabs(state) {
    var userId = store.getters.user.userId;

    db.get(
      "users/" + userId + "/tabs.json?auth=" + store.getters.user.idToken
    ).then(resp => {
      let tabs = { ...resp.data };

      console.log(tabs);

      if (tabs) {
        state.tabData.tabs = {};
        Object.keys(tabs).forEach(tab => {
          Vue.set(state["tabData"].tabs, tab, tabs[tab]);
          Vue.set(state["tabs"], tab, { name: tabs[tab]["name"] });
        });
      }
    });
  },
  closeTab(state, tabObj) {
    var userId = store.getters.user.userId;

    db.delete(
      "users/" +
        userId +
        "/tabs/" +
        tabObj.key +
        ".json?auth=" +
        store.getters.user.idToken
    ).then(resp => {
      Vue.delete(state.tabData.tabs, tabObj.key);
      Vue.delete(state.tabs, tabObj.key);

      const lastExisting = Object.keys(state["tabs"])[
        Object.keys(state["tabs"]).length - 1
      ];

      if (tabObj.key === localStorage.getItem("activeTab")) {
        store.dispatch("fetchList", lastExisting);
        state.activeTab = lastExisting;
      }

      localStorage.setItem("activeTab", lastExisting);
    });
  },
  switchTabs(state, newTabs) {
    const { dbSource, dbTarget } = newTabs,
      userId = store.getters.user.userId;

    let tabs = { ...state.tabs };

    const buftab = tabs[dbSource];

    tabs[dbSource] = { ...tabs[dbTarget] };
    tabs[dbTarget] = { ...buftab };

    let tabData = { ...state.tabData.tabs };
    const buffer = { ...tabData[dbSource] };

    tabData[dbSource] = { ...tabData[dbTarget] };
    tabData[dbTarget] = { ...buffer };

    state.tabData = {
      tabs: { ...tabData }
    };

    state.tabs = { ...tabs };

    if (state.activeTab == dbSource) {
      state.activeTab = dbTarget;
    } else if (state.activeTab == dbTarget) {
      state.activeTab = dbSource;
    }

    console.log(tabData);

    db.put(
      "users/" + userId + "/tabs.json?auth=" + store.getters.user.idToken,
      tabData
    );
  },
  makeTabActive(state, currentActive) {
    state.activeTab = currentActive;
  },
  receiveList(state, tab) {
    var userId = store.getters.user.userId;

    console.log("jest lista");
    state.loaded = false;

    db.get("users/" + userId + ".json?auth=" + store.getters.user.idToken)
      .then(resp => {
        //no list was created (new user)
        var allData = { ...resp.data };

        if (!resp.data) {
          db.put(
            "users/" + userId + ".json?auth=" + store.getters.user.idToken,
            {
              tabs: [
                {
                  name: "First list",
                  tasks: [{ init: true }]
                }
              ]
            }
          ).then(msg => {
            state.tabData = msg.data;
            store.dispatch("fetchTabs");
          });

          state.loaded = true;
        } else {
          state.tabData = allData;

          db.get(
            "users/" +
              userId +
              "/tabs/" +
              tab +
              "/tasks.json?auth=" +
              store.getters.user.idToken
          ).then(resp => {
            //checking if has tasks - after clearing the list, the tasks object on db can be empty
            if (resp.data) {
              let listObj = resp.data,
                init;

              ({ init, ...state.tasks } = listObj);

              state.loaded = true;
              state.activeTab = tab;
            }
            //in that case we have to create the object on next page reload
            else {
              db.put(
                "users/" +
                  userId +
                  "/tabs/" +
                  tab +
                  "/tasks.json?auth=" +
                  store.getters.user.idToken,
                [{ init: true }]
              );
              state.tasks = {};
              state.loaded = true;
            }
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  },
  editList(state, updatedList) {
    var userId = store.getters.user.userId;

    state.tasks = updatedList;

    db.put(
      "users/" +
        userId +
        "/tabs/" +
        localStorage.getItem("activeTab") +
        "/tasks.json?auth=" +
        store.getters.user.idToken,
      updatedList
    );
  },
  ADD_TASK(state, task) {
    var userId = store.getters.user.userId;

    db.post(
      "users/" +
        userId +
        "/tabs/" +
        localStorage.getItem("activeTab") +
        "/tasks.json?auth=" +
        store.getters.user.idToken,
      task
    ).then(resp => {
      let nextSlot =
          "taskInput" + (Number(task.slot.split("taskInput")[1]) + 1),
        nextInput = document.getElementById(nextSlot);

      Vue.set(state.tasks, resp.data.name, task);

      document.getElementById(task.slot).blur();

      //store.dispatch('fetchList');
    });
  },
  CLEAR_LIST(state) {
    var userId = store.getters.user.userId;

    db.delete(
      "users/" +
        userId +
        "/tabs/" +
        localStorage.getItem("activeTab") +
        "/tasks.json?auth=" +
        store.getters.user.idToken
    ).then(resp => {
      state.tasks = {};
    });
  },
  REMOVE_TASK(state, id) {
    let listObj = state.tasks;

    Object.keys(listObj).forEach(task => {
      let userId = store.getters.user.userId;

      if (!listObj[task]["init"] && listObj[task]["id"] === id) {
        db.delete(
          "users/" +
            userId +
            "/tabs/" +
            localStorage.getItem("activeTab") +
            "/tasks/" +
            task +
            ".json?auth=" +
            store.getters.user.idToken
        )
          .then(() => {})
          .catch(error => console.log(error));

        Vue.delete(state.tasks, task);
      }
    });
  },
  UPDATE_TASK(state, { ...task }) {
    let userId = store.getters.user.userId,
      listObj = state.tasks;

    for (let key in listObj) {
      if (task.id === listObj[key].id) {
        Vue.set(state.tasks[key], task.target, task.value);
        db.patch(
          "users/" +
            userId +
            "/tabs/" +
            localStorage.getItem("activeTab") +
            "/tasks/" +
            key +
            ".json?auth=" +
            store.getters.user.idToken,
          state.tasks[key]
        ).then(resp => {
          document.activeElement.blur();
        });
        break;
      }
    }
  }
};

const actions = {
  addTask({ commit }, payload) {
    commit("ADD_TASK", payload);
  },
  clearList({ commit }) {
    commit("CLEAR_LIST");

    //db.put('users/' + store.getters.user.userId + '.json?auth=' + store.getters.user.idToken, {tasks: [{init:true}]}).then(msg => console.log('success'));
  },
  removeTask({ commit }, payload) {
    commit("REMOVE_TASK", payload);
  },
  updateTask({ commit }, { ...payload }) {
    commit("UPDATE_TASK", payload);
  },
  fetchList({ commit }, tab) {
    commit("receiveList", tab);
  },
  editList({ commit }, newOrder) {
    commit("editList", newOrder);
  },
  clearStore({ commit }) {
    commit("resetData");
  },
  createNewTab({ commit }) {
    commit("newTab");
  },
  fetchTabs({ commit }) {
    commit("getTabs");
  },
  editTab({ commit }, tab) {
    commit("editTabName", tab);
  },
  deleteTab({ commit }, tab) {
    commit("closeTab", tab);
  },
  switchTabs({ commit }, tabSwitching) {
    commit("switchTabs", tabSwitching);
  },
  makeTabActive({ commit }, whichTab) {
    commit("makeTabActive", whichTab);
  }
};

export default {
  state,
  mutations,
  actions,
  getters
};
