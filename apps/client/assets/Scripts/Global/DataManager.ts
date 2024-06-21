import { Prefab, SpriteFrame, Node, ForwardPipelineBuilder } from "cc";
import Singleton from "../Base/Singleton";
import { EntityTypeEnum, IActorMove, IBullet, IClienInput, IRoom, IState, InputTypeEnum } from "../Common";
import { ActorManager } from "../Entity/Actor/ActorManager";
import { JoyStickManager } from "../UI/JoyStickManager";
import { WeaponManager } from "../Entity/Weapon/WeaponManager";
import { BulletManager } from "../Entity/Bullet/BulletManager";
import EventManager from "./EventManager";
import { EventEnum } from "../Enum";

const ACTOR_SPEED = 100; // 100px/s
const BULLET_SPEED = 600; // 600px/s

//地图宽高
const MAP_WIDTH = 960;
const MAP_HEIGHT = 640;

const ACTOR_RADIUS = 50;
const BULLET_RADIUS = 10;

const BULLET_DAMAGE = 5;

export default class DataManager extends Singleton {
	static get Instance() {
		return super.GetInstance<DataManager>();
	}

	myPlayerId = 1;
	frameId = 1;
	roomInfo: IRoom;	//存储加入房间的信息

	stage: Node;
	jm: JoyStickManager;
	actorMap: Map<number, ActorManager> = new Map();
	bulletMap: Map<number, BulletManager> = new Map();
	prefabMap: Map<string, Prefab> = new Map();
	textureMap: Map<string, SpriteFrame[]> = new Map();

	state: IState = {
		actors: [
			//注释完前端数据为空，都由后端渲染Biz/Room
			// {
			// 	id: 1,
			// 	hp: 100,
			// 	type: EntityTypeEnum.Actor1,	//角色渲染
			// 	weaponType: EntityTypeEnum.Weapon1,	//武器渲染
			// 	bulletType: EntityTypeEnum.Bullet2,	//子弹渲染
			// 	position: { x: -150, y: -150 },
			// 	direction: { x: 1, y: 0 }
			// },
			// {
			// 	id: 2,
			// 	hp: 100,
			// 	type: EntityTypeEnum.Actor1,	//角色渲染
			// 	weaponType: EntityTypeEnum.Weapon1,	//武器渲染
			// 	bulletType: EntityTypeEnum.Bullet2,	//子弹渲染
			// 	position: { x: 150, y: 150 },
			// 	direction: { x: -1, y: 0 }
			// },
		],
		bullets: [],
		nextBulletId: 1,
	}

	applyInput(input: IClienInput) {
		switch (input.type) {
			case InputTypeEnum.ActorMove: {
				const { id, dt, direction: { x, y }, } = input;

				const actor = this.state.actors.find((e) => e.id === id);
				actor.direction.x = x;
				actor.direction.y = y;

				actor.position.x += x * dt * ACTOR_SPEED;
				actor.position.y += y * dt * ACTOR_SPEED;
				break;
			}
			case InputTypeEnum.WeaponShoot: {
				const { owner, position, direction, } = input;
				const bullet: IBullet = {
					id: this.state.nextBulletId++,
					owner,
					position,
					direction,
					type: this.actorMap.get(owner).bulletType,
				}

				EventManager.Instance.emit(EventEnum.BolletBron, owner);

				this.state.bullets.push(bullet);
				break;
			}
			case InputTypeEnum.TimePast: {
				const { dt } = input;
				const { bullets, actors } = this.state;

				for (let i = bullets.length - 1; i >= 0; i--) {
					const bullet = bullets[i];

					for (let j = actors.length - 1; j >= 0; j--) {
						const actor = actors[j];
						const dx = actor.position.x - bullet.position.x, px = actor.position.x + bullet.position.x;
						const dy = actor.position.y - bullet.position.y, py = actor.position.y + bullet.position.y;
						const dz = ACTOR_RADIUS + BULLET_RADIUS;
						if (dx ** 2 + dy ** 2 < dz ** 2) {
							actor.hp -= BULLET_DAMAGE;
							EventManager.Instance.emit(EventEnum.ExplosionBron, bullet.id, { x: px / 2, y: py / 2 });
							bullets.splice(i, 1); //j穿透爆裂弹
							break;
						}
					}

					if (Math.abs(bullet.position.x) > MAP_WIDTH / 2 || Math.abs(bullet.position.y) > MAP_HEIGHT / 2) {
						EventManager.Instance.emit(EventEnum.ExplosionBron, bullet.id, { x: bullet.position.x, y: bullet.position.y });
						bullets.splice(i, 1);
						break;
					}
				}

				for (const bullet of bullets) {
					bullet.position.x += bullet.direction.x * dt * BULLET_SPEED;
					bullet.position.y += bullet.direction.y * dt * BULLET_SPEED;
				}
			}
		}


	}
}
