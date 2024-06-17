import { _decorator, Component, EventTouch, Input, input, instantiate, Node, ProgressBar, UITransform, Vec2 } from 'cc';
import DataManager from '../../Global/DataManager';
import { EntityTypeEnum, IActor, InputTypeEnum } from '../../Common';
import { EntityManager } from '../../Base/EntityManager';
import { ActorStateMachine } from './ActorStateMachine';
import { EntityStateEnum, EventEnum, PrefabPathEnum } from '../../Enum';
import { WeaponManager } from '../Weapon/WeaponManager';
import { rad2Angle } from '../../Utils';
import EventManager from '../../Global/EventManager';
const { ccclass, property } = _decorator;

@ccclass('ActorManager')
export class ActorManager extends EntityManager {
    id: number;
    bulletType:EntityTypeEnum;

    private hp : ProgressBar;

    private wm: WeaponManager;
    init(data: IActor) {
        this.id = data.id;
        // this.hp = this.node.getChildByName("hp").getComponent(ProgressBar);
        this.hp = this.node.getComponentInChildren(ProgressBar);
        this.bulletType = data.bulletType;
        this.fsm = this.addComponent(ActorStateMachine);
        this.fsm.init(data.type);

        this.state = EntityStateEnum.Idle;

        //枪的实例化
        const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Weapon1);
        const weapon = instantiate(prefab);
        weapon.setParent(this.node);
        this.wm = weapon.addComponent(WeaponManager);
        console.log("seccuss",prefab);
        this.wm.init(data);
    }

    tick(dt) {
        if(this.id !== DataManager.Instance.myPlayerId) return ;
        if (DataManager.Instance.jm.input.length()) {
            const { x, y } = DataManager.Instance.jm.input;
            EventManager.Instance.emit(EventEnum.ClientSync,{
                id: 1,
                type: InputTypeEnum.ActorMove,
                direction: { x, y, },
                dt,
            });
            // DataManager.Instance.applyInput({
            //     id: 1,
            //     type: InputTypeEnum.ActorMove,
            //     direction: { x, y, },
            //     dt,
            // })
            console.log(DataManager.Instance.state.actors[0].position.x, DataManager.Instance.state.actors[0].position.y);

            this.state = EntityStateEnum.Run;
        } else {
            this.state = EntityStateEnum.Idle;
        }
    }
    render(data: IActor) {
        const { direction, position } = data;
        this.node.setPosition(position.x, position.y);
        //人物翻转
        if (direction.x !== 0) {
            this.node.setScale(direction.x > 0 ? 1 : -1, 1);
            //血条不跟着翻转
            this.hp.node.setScale(direction.x > 0 ? 1 : -1, 1);
        }

        const side = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        // const rad = Math.atan2(direction.y, direction.x);
        const rad = Math.asin(direction.y / side);
        const angle = rad2Angle(rad);

        this.wm.node.setRotationFromEuler(0, 0, angle);

        this.hp.progress = data.hp / this.hp.totalLength;
    }
}

