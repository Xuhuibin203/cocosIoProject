import { _decorator, Component, director, instantiate, Node, Prefab } from 'cc';
import { NetworkManager } from '../Global/NetworkManager';
import DataManager from '../Global/DataManager';
import { ApiMsgEnum, IApiPlayerListRes, IApiRoomListRes } from '../Common';
import { PlayerManager } from '../UI/PlayerManager';
import { EventEnum, SceneEnum } from '../Enum';
import { RoomManager } from '../UI/RoomManager';
import EventManager from '../Global/EventManager';
const { ccclass, property } = _decorator;

@ccclass('HallManager')
export class HallManager extends Component {
    @property(Node) playerContainer: Node;
    @property(Prefab) playerPrefab: Prefab;

    @property(Node) roomContainer: Node;
    @property(Prefab) roomPrefab: Prefab;

    onLoad() {
        EventManager.Instance.on(EventEnum.RoomJoin, this.handleJoinRoom, this);
        NetworkManager.Instance.listenMsg(ApiMsgEnum.MsgPlayerList, this.renderPlayer, this);   //前端渲染监听玩家列表
        NetworkManager.Instance.listenMsg(ApiMsgEnum.MsgRoomList, this.renderRoom, this);   //前端渲染监听玩家列表
    }

    start() {
        //初始化清除所有contain中的子节点
        this.playerContainer.destroyAllChildren();
        this.roomContainer.destroyAllChildren();
        this.getPlayers();
        this.getRooms();
    }

    onDestroy() {
        EventManager.Instance.off(EventEnum.RoomJoin, this.handleJoinRoom, this);
        NetworkManager.Instance.unlistenMsg(ApiMsgEnum.MsgPlayerList, this.renderPlayer, this);   //前端渲染监听玩家列表
        NetworkManager.Instance.unlistenMsg(ApiMsgEnum.MsgRoomList, this.renderRoom, this);   //前端渲染监听玩家列表
    }

    async getPlayers() {
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerList, {});
        if (!success) {
            console.log(error);
            return;
        }

        // console.log("res",res); 
        this.renderPlayer(res);
    }

    renderPlayer({ list }: IApiPlayerListRes) {
        for (const c of this.playerContainer.children) {
            c.active = false;
        }
        while (this.playerContainer.children.length < list.length) {
            const node = instantiate(this.playerPrefab);
            node.active = false;
            node.setParent(this.playerContainer);
        }

        // console.log("list",list);
        //显示大厅的每个节点
        for (let i = 0; i < list.length; i++) {
            const data = list[i];
            const node = this.playerContainer.children[i];
            node.getComponent(PlayerManager).init(data);
        }
    }

    async getRooms() {
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomList, {});
        if (!success) {
            console.log(error);
            return;
        }

        // console.log("res",res); 
        this.renderRoom(res);
    }

    renderRoom({ list }: IApiRoomListRes) {
        for (const c of this.roomContainer.children) {
            c.active = false;
        }
        while (this.roomContainer.children.length < list.length) {
            const node = instantiate(this.roomPrefab);
            node.active = false;
            node.setParent(this.roomContainer);
        }

        console.log("list", list);
        //显示大厅的每个节点
        for (let i = 0; i < list.length; i++) {
            const data = list[i];
            const node = this.roomContainer.children[i];
            node.getComponent(RoomManager).init(data);
        }
    }

    async handleCreateRoom() {
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomCreate, {});
        if (!success) {
            console.log(error);
            return;
        }

        DataManager.Instance.roomInfo = res.room;
        // console.log("DataManager.Instance.roomInfo", DataManager.Instance.roomInfo);
        director.loadScene(SceneEnum.Room);
    }

    async handleJoinRoom(rid:number) {
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomJoin, {rid,});
        if (!success) {
            console.log(error);
            return;
        }

        DataManager.Instance.roomInfo = res.room;
        console.log("DataManager.Instance.roomInfo", DataManager.Instance.roomInfo);
        director.loadScene(SceneEnum.Room);
    }
}

