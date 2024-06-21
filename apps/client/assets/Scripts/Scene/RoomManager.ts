import { _decorator, Component, director, instantiate, Node, Prefab } from 'cc';
import { NetworkManager } from '../Global/NetworkManager';
import DataManager from '../Global/DataManager';
import { ApiMsgEnum, IApiPlayerListRes, IApiRoomListRes, IMsgGameStart, IMsgRoom } from '../Common';
import { PlayerManager } from '../UI/PlayerManager';
import { SceneEnum } from '../Enum';
const { ccclass, property } = _decorator;

@ccclass('RoomManager')
export class RoomManager extends Component {
    @property(Node) playerContainer:Node;
    @property(Prefab) playerPrefab:Prefab;

    onLoad(){
        NetworkManager.Instance.listenMsg(ApiMsgEnum.MsgRoom, this.renderPlayer, this);   //前端渲染监听玩家列表
        NetworkManager.Instance.listenMsg(ApiMsgEnum.MsgGameStart, this.handleGameStart, this);   //前端渲染监听玩家列表

    }
    
    start(){
        this.renderPlayer({
            room:DataManager.Instance.roomInfo,
        })
    }
    
    onDestroy(){
        NetworkManager.Instance.unlistenMsg(ApiMsgEnum.MsgRoom, this.renderPlayer, this);   //前端取消绑定渲染监听玩家列表
        NetworkManager.Instance.unlistenMsg(ApiMsgEnum.MsgGameStart, this.handleGameStart, this);   //前端取消绑定渲染监听玩家列表
    }

    renderPlayer({room:{players:list}}:IMsgRoom){
        for (const c of this.playerContainer.children) {
            c.active = false;
        }
        while(this.playerContainer.children.length < list.length){
            const node = instantiate(this.playerPrefab);
            node.active = false;
            node.setParent(this.playerContainer);
        }

        // console.log("list",list);
        //显示大厅的每个节点
        for(let i = 0 ; i < list.length ; i ++){
            const data = list[i];
            const node = this.playerContainer.children[i];
            node.getComponent(PlayerManager).init(data);
        }
    }

    async handleLeaveRoom(){
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomLeave, {});
        if (!success) {
            console.log(error);
            return;
        }

        DataManager.Instance.roomInfo = null;
        console.log("DataManager.Instance.roomInfo",DataManager.Instance.roomInfo);
        director.loadScene(SceneEnum.Hall);
    }

    async handleStart(){
        console.log("click!!!!!!!");
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiGameStart, {});
        if (!success) {
            console.log(error);
            return;
        }
         
    }

    handleGameStart({state}:IMsgGameStart){
        DataManager.Instance.state = state;
        director.loadScene(SceneEnum.Battle);
    }
} 

