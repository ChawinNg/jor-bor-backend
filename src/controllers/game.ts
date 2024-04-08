import { ObjectId } from "mongodb";
import { IGame } from "../models/game";
import { Role, IPlayer } from "../models/player";
import { Request, Response } from "express";


interface IUser {
    _id: ObjectId;
    name: string;
}

export class WerewolfGame {
    players: IPlayer[];
    villagers: IPlayer[];
    werewolves: IPlayer[];
    seers: IPlayer[];
    alive_players: IPlayer[];
    totalPlayers: number;
    villager_side_left: number; // including seer
    seer_left: number;
    werewolf_side_left: number;

    constructor(users: IUser[]) {
        this.totalPlayers = users.length;
        this.players = [];
        this.alive_players = [];
        this.villagers = [];
        this.werewolves = [];
        this.seers = [];
        this.assignRoles(users);
        this.play();
    }

    shuffleRoles(): Role[] {
        const roles: Role[] = [];

        const werewolves_num = Math.floor(this.totalPlayers / 3);
        this.werewolf_side_left = werewolves_num;
        for (let i = 0; i < werewolves_num; i++) {roles.push(Role.Werewolf)}

        const seer_num = 1;
        this.seer_left = seer_num;
        for (let i = 0; i < seer_num; i++) {roles.push(Role.Seer)}        

        const villagers_num = this.totalPlayers - werewolves_num - seer_num;
        this.villager_side_left = this.totalPlayers - werewolves_num;
        for (let i = 0; i < villagers_num; i++) {roles.push(Role.Villager)}

        // Shuffle
        for (let i = this.totalPlayers - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [ roles[i], roles[j] ] = [ roles[j], roles[i] ];
        }

        return roles;
    }

    assignRoles(users: IUser[]) {
        const roles = this.shuffleRoles();

        users.forEach((user, i) => {
            const role = roles[i];
            const alive = true;
            const player = {
                ...user,
                role,
                alive,
            }
            console.log(player);
            this.players.push(player);
            this.alive_players.push(player);

            switch (player.role) {
                case (Role.Werewolf): {
                    this.werewolves.push(player);
                    break;
                }
                case (Role.Seer): {
                    this.seers.push(player);
                    break;
                }
                default: {
                    this.villagers.push(player);
                    break;
                }
            }
        })
    }

    // Night phase
    performNightActions() {
        // Werewolf
        while (true) {
            const selectedPlayerIndex = Math.floor(Math.random() * this.alive_players.length);
            const selectedPlayer = this.alive_players[selectedPlayerIndex];
            if (selectedPlayer.role !== Role.Werewolf) {
                this.alive_players.splice(selectedPlayerIndex, 1);
                selectedPlayer.alive = false;
                this.villager_side_left -= 1;
                if (selectedPlayer.role === Role.Seer) {
                    this.seer_left -= 1;
                }
                console.log(`${selectedPlayer.name} was killed by werewolves`)
                break;
            }
        }

        // Seer
        if (this.seer_left > 0) {
            const i = Math.floor(Math.random() * this.alive_players.length);
            const selected = this.alive_players[i];
            if (selected.role === Role.Werewolf) {
                console.log(`${selected.name} is on werewolf side`);
            } else {
                console.log(`${selected.name} is on villager side`);
            }
        }
    }

    performDayActions() {
        // for some talking period
        const randomPlayerIndex = Math.floor(Math.random() * this.alive_players.length);
        const randomPlayer = this.alive_players[randomPlayerIndex]
        this.alive_players.splice(randomPlayerIndex, 1);
        randomPlayer.alive = false;
        console.log(`${randomPlayer.name} has been voted. His/her role is ${Role[randomPlayer.role]}`)
        if (randomPlayer.role === Role.Werewolf) {
            this.werewolf_side_left -= 1;
        } else {
            this.villager_side_left -= 1;
            if (randomPlayer.role === Role.Seer) {
                this.seer_left -= 1;
            }
        }
    }

    play() {
        console.log('game start');
        this.logStatus();
        while (true) {
            if (!this.isGameOver()) {
                this.performNightActions();
                this.logStatus();
            } else {
                break;
            }
            if (!this.isGameOver()) {
                this.performDayActions();
                this.logStatus();
            } else {
                break;
            }
        }
        console.log('game end');
        if (this.werewolf_side_left === 0) {
            console.log('Villagers win');
        } else {
            console.log('Werewolves win');
        }
    }

    isGameOver() {
        if (this.villager_side_left === this.werewolf_side_left || this.werewolf_side_left === 0) {
            return true;
        }
        return false;
    }

    logStatus() {
        this.players.forEach((player) => {
            console.log(`_id: ${player._id} name: ${player.name} role: ${Role[player.role]} status: ${player.alive}`)
        })
    }
}

export async function getGame(req: Request, res: Response) {
    const users: IUser[] = [
        {_id: new ObjectId(), name: 'A'},
        {_id: new ObjectId(), name: 'B'},
        {_id: new ObjectId(), name: 'C'},
        {_id: new ObjectId(), name: 'D'},
        {_id: new ObjectId(), name: 'E'},
        {_id: new ObjectId(), name: 'F'},
        {_id: new ObjectId(), name: 'G'},
        {_id: new ObjectId(), name: 'H'},
    ]
    console.log(users.length)

    const game = new WerewolfGame(users);

    return res.status(200).send({
        message: game.players
    })
}