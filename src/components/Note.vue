<template>
  <div id="note">
    <app-heading></app-heading>
    <div id="tabsSection">
      <div id="addTab" @click="newTab">+</div>
      <div>
        <Container id="tabs" @drag-start="dragStart" @drop="tabReplace" orientation="horizontal" lock-axis="x">
          <Draggable v-for="(tab, tabKey,index) in allTabs" :key="`tab_${index}_${tab.name}`">
            <app-task-tab
                    :name="tab.name"
                    :tabKey="tabKey"
                    @makeActive="activateTab"
                    :isActive="activatedTab"
            >
            </app-task-tab>
          </Draggable>
        </Container>
      </div>
    </div>
    <app-task-list :taskListTab="activeTab"></app-task-list>
  </div>
</template>

<script>
  import Heading from './Heading'
  import TaskList from './TaskList'
  import Footer from './Footer'
  import TaskTab from './taskTab'
  import {Container, Draggable} from 'vue-smooth-dnd'
  import {mapGetters, mapActions} from 'vuex'

  export default {
    components:{
      appHeading: Heading,
      appTaskList: TaskList,
      appTaskTab: TaskTab,
      Container,
      Draggable
    },
    data(){
      return {
      }
    },
    mounted(){
      this.fetchTabs();
    },
    computed: {
      ...mapGetters([
        'tabs',
        'activeTab'
      ]),
      allTabs(){
        return JSON.parse(JSON.stringify(this.tabs));
      },
      activatedTab(){
        return this.activeTab;
      }
    },
    methods:{
      ...mapActions([
        'createNewTab',
        'makeTabActive',
        'fetchTabs',
        'switchTabs'
      ]),
      newTab(){
        this.createNewTab();
      },
      activateTab(tab){
        this.makeTabActive(tab);
      },
      dragStart(){

      },
      tabReplace(tabReplaceData){
        let tabs = {...this.allTabs};

        const tabsList   = Object.keys(tabs),
              draggedKey = tabsList[tabReplaceData.removedIndex],
              targetKey  = tabsList[tabReplaceData.addedIndex],
              buffer = {...tabs[draggedKey]};

        tabs[draggedKey] = {...tabs[targetKey]};
        tabs[targetKey] = {...buffer};

        this.switchTabs({ 
          dbSource: draggedKey, 
          dbTarget: targetKey});
      }
    }
  }
</script>

<style scoped>

#note
{
  height: 100%%;
  background-color: rgba(245, 240, 55, 0.9);
  border-bottom-right-radius: 15px;
  width: 95%;
  margin: 0 auto;
  display: grid;
  grid-template-rows: 10% 3% 87%;
}

::-webkit-scrollbar{
  background-color: rgba(0, 0, 0, 0.0);
}

::-webkit-scrollbar-thumb{
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-button{
  background-size: cover;
  background-position: -15px 0;
  height: 10px;
  width: 10px;
}

#tabsSection{
  background-color: white;
  display: grid;
  grid-template-columns: 1fr 9fr;
  border-bottom: 0.5px solid black;
  justify-self: stretch;
}

#tabs{
  overflow-y: scroll;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18vw,20vw));
  background-color: white;
  justify-items: stretch;
  justify-content: start;
}

#addTab
{
  font-weight: bolder;
  background-color: #dedbdb;
  border-top-right-radius: 20px;
  cursor: pointer;
}

/*::-webkit-scrollbar-button:increment{
  background-image: url("../images/arrow-down.png");
  background-position: -15px -18px;
}

::-webkit-scrollbar-button:decrement{
  background-image: url("../images/arrow-up.png");
}*/

</style>