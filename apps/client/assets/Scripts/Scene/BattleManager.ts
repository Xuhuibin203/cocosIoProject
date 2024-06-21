import { _decorator, Component, EventTouch, Input, input, instantiate, Node, Prefab, SpriteFrame, UITransform, Vec2 } from 'cc';
import DataManager from '../Global/DataManager';
import { JoyStickManager } from '../UI/JoyStickManager';
import { ResourceManager } from '../Global/ResourceManager';
import { ActorManager } from '../Entity/Actor/ActorManager'; // 导入ActorManager类自我处理
import { EventEnum, PrefabPathEnum, TexturePathEnum } from '../Enum';
import { ApiMsgEnum, EntityTypeEnum, IClienInput, InputTypeEnum } from '../Common';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { ObjectPoolManager } from '../Global/ObjectPoolManager';
import { NetworkManager } from '../Global/NetworkManager';
import EventManager from '../Global/EventManager';
import { IMsgServerSync } from '../Common/Msg';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
    private stage: Node;
    private ui: Node;

    private shouldUpdate = false;
    // onLoad() {
    // DataManager.Instance.stage = this.stage = this.node.getChildByName("Stage");
    // this.ui = this.node.getChildByName("UI");
    // this.stage.destroyAllChildren();
    // DataManager.Instance.jm = this.ui.getComponentInChildren(JoyStickManager);
    // }

    async start() {
        this.clearGame();
        await Promise.all([this.connectSever(), this.londRes()]);
        this.initGame();
        // const {success,error,res} = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerJoin, "我是COCOS");
        // if(!success){
        //     console.log(error);
        //     return ;
        // }
        // console.log("res!",res);
        // NetworkManager.Instance.sendMsg("nihao,wo shi cocos creator");
        // NetworkManager.Instance.listenMsg("haha",(data)=>{
        //     console.log("listenMsg",data);
        // },this); //测试代码
        // this.initMap();
        // this.shouldUpdate = true;
    }

    //@onLoad
    initGame() {
        DataManager.Instance.jm = this.ui.getComponentInChildren(JoyStickManager);
        this.initMap();
        this.shouldUpdate = true;
        EventManager.Instance.on(EventEnum.ClientSync, this.handleClientSync, this);
        NetworkManager.Instance.listenMsg(ApiMsgEnum.MsgServerSync, this.handleServerSync, this);
    }
    clearGame() {
        DataManager.Instance.stage = this.stage = this.node.getChildByName("Stage");
        this.ui = this.node.getChildByName("UI");
        this.stage.destroyAllChildren();
        EventManager.Instance.off(EventEnum.ClientSync, this.handleClientSync, this);
        NetworkManager.Instance.unlistenMsg(ApiMsgEnum.MsgServerSync, this.handleServerSync, this);
    }

    async connectSever() {
        if (!(await NetworkManager.Instance.connect().catch(() => false))) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.connectSever();
        }
    }

    async londRes() {
        const list = [];
        for (const type in PrefabPathEnum) {
            const p = ResourceManager.Instance.loadRes(PrefabPathEnum[type], Prefab).then((prefab) => {
                DataManager.Instance.prefabMap.set(type, prefab);
            })
            list.push(p);
            console.log("加载资源", type);
        }

        for (const type in TexturePathEnum) {
            const p = ResourceManager.Instance.loadDir(TexturePathEnum[type], SpriteFrame).then((spriteFrame) => {
                DataManager.Instance.textureMap.set(type, spriteFrame);
            })
            list.push(p);
            // console.log("加载资源", type);
        }
        await Promise.all(list);
    }

    initMap() {
        const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Map)
        const map = instantiate(prefab);
        map.setParent(this.stage);
    }

    update(dt) {
        if (!this.shouldUpdate) return;
        this.render();
        this.tick(dt);
    }
    tick(dt) {
        this.tickActor(dt);

        DataManager.Instance.applyInput({
            type: InputTypeEnum.TimePast,
            dt,
        })
    }
    tickActor(dt) {
        for (const data of DataManager.Instance.state.actors) {
            const { id } = data;
            let am = DataManager.Instance.actorMap.get(id);
            am.tick(dt);
        }
    }

    render() {
        this.renderActor();
        this.renderBullet();
    }

    async renderActor() {
        for (const data of DataManager.Instance.state.actors) {
            const { id, type } = data;
            let am = DataManager.Instance.actorMap.get(id);

            if (!am) {
                const prefab = DataManager.Instance.prefabMap.get(type)
                const actor = instantiate(prefab);
                actor.setParent(this.stage);
                am = actor.addComponent(ActorManager);
                DataManager.Instance.actorMap.set(data.id, am);
                am.init(data);
            } else {
                am.render(data);
            }
        }
    }

    renderBullet() {
        for (const data of DataManager.Instance.state.bullets) {
            const { id, type } = data;
            let bm = DataManager.Instance.bulletMap.get(id);

            if (!bm) {
                // const prefab = DataManager.Instance.prefabMap.get(type);
                // const bullet = instantiate(prefab);
                const bullet = ObjectPoolManager.Instance.get(type);
                // bullet.setParent(this.stage);
                // bm = bullet.addComponent(BulletManager);
                bm = bullet.getComponent(BulletManager) || bullet.addComponent(BulletManager);
                DataManager.Instance.bulletMap.set(data.id, bm);
                bm.init(data);
            } else {
                bm.render(data);
            }
        }
    }
    handleClientSync(input: IClienInput) {
        const msg = {
            input,
            frameId: DataManager.Instance.frameId++,
        }
        NetworkManager.Instance.sendMsg(ApiMsgEnum.MsgClientSync, msg);
    }
    //类型以后会补全(已补全)
    handleServerSync({ inputs }: IMsgServerSync) {
        for (const input of inputs) {
            DataManager.Instance.applyInput(input);
        }
    }
}

