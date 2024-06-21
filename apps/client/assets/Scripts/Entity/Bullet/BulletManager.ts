import { _decorator, Component, EventTouch, Input, input, instantiate, IVec2, Node, tween, Tween, UITransform, Vec2, Vec3 } from 'cc';
import DataManager from '../../Global/DataManager';
import { EntityTypeEnum, IActor, InputTypeEnum, IBullet } from '../../Common';
import { EntityManager } from '../../Base/EntityManager';
import { EntityStateEnum, EventEnum, PrefabPathEnum } from '../../Enum';
import { WeaponManager } from '../Weapon/WeaponManager';
import { rad2Angle } from '../../Utils';
import { BulletStateMachine } from './BulletStateMachine';
import EventManager from '../../Global/EventManager';
import { ExplosionManager } from '../Explosion/ExplosionManager';
import { ObjectPoolManager } from '../../Global/ObjectPoolManager';
const { ccclass, property } = _decorator;

@ccclass('BulletManager')
export class BulletManager extends EntityManager {

    type: EntityTypeEnum;
    id: number;

    private targetPos: Vec3; //记录目标位置
    private tw: Tween<unknown>;

    init(data: IBullet) {
        this.type = data.type;
        this.id = data.id;
        this.fsm = this.addComponent(BulletStateMachine);
        this.fsm.init(data.type);

        this.state = EntityStateEnum.Idle;

        this.node.active = false;
        this.targetPos = undefined;

        EventManager.Instance.on(EventEnum.ExplosionBron, this.handleExplosionBron, this);
    }

    handleExplosionBron(id: number, { x, y }: IVec2) {
        if (id !== this.id) return;

        // const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Explosion);
        // const explosion = instantiate(prefab);
        const explosion = ObjectPoolManager.Instance.get(EntityTypeEnum.Explosion);
        // explosion.setParent(DataManager.Instance.stage);
        // const em = explosion.addComponent(ExplosionManager);
        const em = explosion.getComponent(ExplosionManager) || explosion.addComponent(ExplosionManager)
        em.init(EntityTypeEnum.Explosion, { x, y });

        EventManager.Instance.off(EventEnum.ExplosionBron, this.handleExplosionBron, this);
        DataManager.Instance.bulletMap.delete(this.id);
        // this.node.destroy();
        ObjectPoolManager.Instance.ret(this.node);
    }

    render(data: IBullet) {
        this.renderPos(data);
        this.renderDire(data);
    }

    renderPos(data: IBullet) {
        const { direction, position } = data;
        const newPos = new Vec3(position.x, position.y);
        //先寻找有无目标位置
        if (!this.targetPos) {
            this.node.active = true;
            this.node.setPosition(newPos);
            this.targetPos = new Vec3(newPos);
        } else if (!this.targetPos.equals(newPos)) {
            this.tw?.stop();
            this.node.setPosition(this.targetPos);
            this.targetPos.set(newPos);
            this.tw = tween(this.node)
                .to(0.1, {
                    position: this.targetPos,
                })
                .start()
        }
    }

    renderDire(data: IBullet) {
        const { direction, position } = data;

        const side = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        let angle = rad2Angle(Math.asin(direction.y / side));
        angle = direction.x > 0 ? angle : 180 - angle;

        this.node.setRotationFromEuler(0, 0, angle);
    }
}

