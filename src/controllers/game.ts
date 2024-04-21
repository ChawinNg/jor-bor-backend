import { Server, Socket } from 'socket.io';
import http from 'http';
import { ObjectId } from "mongodb";
import { IGame } from "../models/game";
import { Role, IPlayer } from "../models/player";
import { Request, Response } from "express";


interface IUser {
    _id: ObjectId;
    name: string;
}

interface GameData {
    players: any[];
    villagers: any[];
    werewolves: any[];
    seers: any[];
    alive_players: any[];
    totalPlayers: number;
    villager_side_left: number; // including seer
    seer_left: number;
    werewolf_side_left: number;
    isNight: boolean;
}

export class WerewolfGame {
    io: Server;
    gameState: Map<string, GameData>;

    constructor(io: Server) {
        this.io = io;
        this.gameState = new Map<string, GameData>();
        // this.totalPlayers = users.length;
        // this.players = [];
        // this.alive_players = [];
        // this.villagers = [];
        // this.werewolves = [];
        // this.seers = [];
        // this.assignRoles(users);
        // this.play();
    }

    handleJoinGame(socket: Socket, lobby_id: string) {
        socket.data.role = null;
        console.log(`socket ${socket.id} is joining game ${lobby_id}`);
        socket.join(lobby_id);

        
        const users: any[] = [];
        let room = this.io.sockets.adapter.rooms.get(lobby_id);
        if (room) {
            console.log('room found')
            console.log(room)
            
            for (let [id, socket] of this.io.of("/").sockets) {
                if (socket.rooms.has(lobby_id)) {
                    users.push({
                        socketID: id,
                        username: socket.handshake.auth.username,
                        userId: socket.handshake.auth.user_id,
                        role: socket.data.role,
                    });
                }
            }
        } else {console.log('not found')}
        console.log(users);

        const initGameData: GameData = {
            players: [socket.id],
            villagers: [],
            werewolves: [],
            seers: [],
            alive_players: [socket.id],
            totalPlayers: 1,
            villager_side_left: 0,
            seer_left: 0,
            werewolf_side_left: 0,
            isNight: false,
        }

        if (!this.gameState.has(lobby_id)) {
            this.gameState.set(lobby_id, initGameData);
        } else {
            if (this.gameState.has(lobby_id)) {
                const current = this.gameState.get(lobby_id);
                current?.players.push(socket.id);
                current?.alive_players.push(socket.id);
                if (current?.totalPlayers !== undefined) {
                    current.totalPlayers += 1;
                }
            }
        }
        console.log('Current room', this.gameState.get(lobby_id));

        this.io.in(lobby_id).emit("inGameUsers", users);
    }

    handleStart(socket: Socket, lobby_id: string) {
        this.assignRoles(lobby_id);
    }

    shuffleRoles(lobby_id: string): Role[] {
        const roles: Role[] = [];
        const current = this.gameState.get(lobby_id);

        if (current) {
           const werewolves_num = Math.floor(current?.totalPlayers / 3);
           current.werewolf_side_left = werewolves_num;

           for (let i = 0; i < werewolves_num; i++) {roles.push(Role.Werewolf)}
           
           const seer_num = 1;
           current.seer_left = seer_num;
           for (let i = 0; i < seer_num; i++) {roles.push(Role.Seer)}        
           
           const villagers_num = current.totalPlayers - werewolves_num - seer_num;
           current.villager_side_left = current.totalPlayers - werewolves_num;
           for (let i = 0; i < villagers_num; i++) {roles.push(Role.Villager)}
           
           // Shuffle
           for (let i = current.totalPlayers - 1; i > 0; i--) {
               const j = Math.floor(Math.random() * (i+1));
               [ roles[i], roles[j] ] = [ roles[j], roles[i] ];
            }
        }

        return roles;
    }

    assignRoles(lobby_id: string) {
        const roles = this.shuffleRoles(lobby_id);
        const current = this.gameState.get(lobby_id);
        let i = 0;

        if (current) {
            const users: any[] = [];
            let room = this.io.sockets.adapter.rooms.get(lobby_id);
            if (room) {
                console.log('room found')
                console.log(room)

                for (let [id, socket] of this.io.of("/").sockets) {
                    if (socket.rooms.has(lobby_id)) {
                        const info = {
                            socketID: id,
                            username: socket.handshake.auth.username,
                            userId: socket.handshake.auth.user_id,
                            role: roles[i],
                            alive: true,
                        }
                        this.io.to(id).emit('assignRole', info);
                        users.push(info);

                        switch (info.role) {
                            case (Role.Werewolf): {
                                current.werewolves.push(id);
                                break;
                            }
                            case (Role.Seer): {
                                current.seers.push(id);
                                break;
                            }
                            default: {
                                current.villagers.push(id);
                                break;
                            }
                        }

                        i++;
                    }
                }
            } else {console.log('not found')}
            console.log(users);
            // this.io.in(lobby_id).emit("assignRole", users);
        }
    }

    // // Night phase
    // performNightActions() {
    //     // Werewolf
    //     while (true) {
    //         const selectedPlayerIndex = Math.floor(Math.random() * this.alive_players.length);
    //         const selectedPlayer = this.alive_players[selectedPlayerIndex];
    //         if (selectedPlayer.role !== Role.Werewolf) {
    //             this.alive_players.splice(selectedPlayerIndex, 1);
    //             selectedPlayer.alive = false;
    //             this.villager_side_left -= 1;
    //             if (selectedPlayer.role === Role.Seer) {
    //                 this.seer_left -= 1;
    //             }
    //             console.log(`${selectedPlayer.name} was killed by werewolves`)
    //             break;
    //         }
    //     }

    //     // Seer
    //     if (this.seer_left > 0) {
    //         const i = Math.floor(Math.random() * this.alive_players.length);
    //         const selected = this.alive_players[i];
    //         if (selected.role === Role.Werewolf) {
    //             console.log(`${selected.name} is on werewolf side`);
    //         } else {
    //             console.log(`${selected.name} is on villager side`);
    //         }
    //     }
    // }

    // performDayActions() {
    //     // for some talking period
    //     const randomPlayerIndex = Math.floor(Math.random() * this.alive_players.length);
    //     const randomPlayer = this.alive_players[randomPlayerIndex]
    //     this.alive_players.splice(randomPlayerIndex, 1);
    //     randomPlayer.alive = false;
    //     console.log(`${randomPlayer.name} has been voted. His/her role is ${Role[randomPlayer.role]}`)
    //     if (randomPlayer.role === Role.Werewolf) {
    //         this.werewolf_side_left -= 1;
    //     } else {
    //         this.villager_side_left -= 1;
    //         if (randomPlayer.role === Role.Seer) {
    //             this.seer_left -= 1;
    //         }
    //     }
    // }

    // play() {
    //     console.log('game start');
    //     this.logStatus();
    //     while (true) {
    //         if (!this.isGameOver()) {
    //             this.performNightActions();
    //             this.logStatus();
    //         } else {
    //             break;
    //         }
    //         if (!this.isGameOver()) {
    //             this.performDayActions();
    //             this.logStatus();
    //         } else {
    //             break;
    //         }
    //     }
    //     console.log('game end');
    //     if (this.werewolf_side_left === 0) {
    //         console.log('Villagers win');
    //     } else {
    //         console.log('Werewolves win');
    //     }
    // }

    // isGameOver() {
    //     if (this.villager_side_left === this.werewolf_side_left || this.werewolf_side_left === 0) {
    //         return true;
    //     }
    //     return false;
    // }

    // logStatus() {
    //     this.players.forEach((player) => {
    //         console.log(`_id: ${player._id} name: ${player.name} role: ${Role[player.role]} status: ${player.alive}`)
    //     })
    // }
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


    // const game = new WerewolfGame(users, server);

    return res.status(200).send({
        // message: game.players
    })
}