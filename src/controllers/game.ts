import { Server, Socket } from 'socket.io';
import http from 'http';
import { ObjectId } from "mongodb";
import { IGame } from "../models/game";
import { Role, IPlayer } from "../models/player";
import { Request, Response } from "express";
import { getLobbyById } from './lobby';


interface IUser {
    _id: ObjectId;
    name: string;
}

interface GameData {
    players: any[];
    villagers: any[];
    werewolves: any[];
    seers: string;
    alive_players: any[];
    votes: any[];
    totalPlayers: number;
    villager_side_left: number; // including seer
    seer_left: number;
    werewolf_side_left: number;
    isNight: boolean;
}

export class WerewolfGame {
    io: Server;
    gameState: Map<string, GameData>;
    votingTimers: Map<string, NodeJS.Timeout>;
    checkingTimers: Map<string, NodeJS.Timeout>;
    killingTimers: Map<string, NodeJS.Timeout>;
    toNextStages: Map<string, boolean>;

    constructor(io: Server) {
        this.io = io;
        this.gameState = new Map<string, GameData>();
        this.votingTimers = new Map();
        this.checkingTimers = new Map();
        this.killingTimers = new Map();
        this.toNextStages = new Map();

        // this.totalPlayers = users.length;
        // this.players = [];
        // this.alive_players = [];
        // this.villagers = [];
        // this.werewolves = [];
        // this.seers = [];
        // this.assignRoles(users);
        // this.play();
    }

    handleJoinGame(socket: Socket, lobby_id: string, players: any[]) {
        socket.data.role = null;
        // console.log(`socket ${socket.id} is joining game ${lobby_id}`);
        // socket.join(lobby_id);
        const userIds: any[] = [];
        players.forEach((player) => {
            userIds.push(player._id);
        })
        
        const users: any[] = [];

        for (let [id, socket] of this.io.of("/").sockets) {
            if (userIds.indexOf(socket.handshake.auth.user_id) !== -1) {
                users.push({
                    socketID: id,
                    username: socket.handshake.auth.username,
                    userId: socket.handshake.auth.user_id,
                    role: socket.data.role,
                });
                socket.join(lobby_id);
            }
        }
        
        // let room = this.io.sockets.adapter.rooms.get(lobby_id);
        // if (room) {
        //     console.log('room found')
        //     console.log(room)
            
        //     for (let [id, socket] of this.io.of("/").sockets) {
        //         if (socket.rooms.has(lobby_id)) {
        //             users.push({
        //                 socketID: id,
        //                 username: socket.handshake.auth.username,
        //                 userId: socket.handshake.auth.user_id,
        //                 role: socket.data.role,
        //             });
        //         }
        //     }
        // } else {console.log('not found')}
        // console.log(users);

        const initGameData: GameData = {
            players: userIds,
            villagers: new Array(),
            werewolves: new Array(),
            seers: '',
            alive_players: userIds,
            votes: new Array(),
            totalPlayers: userIds.length,
            villager_side_left: 0,
            seer_left: 0,
            werewolf_side_left: 0,
            isNight: false,
        }
        if (!this.gameState.has(lobby_id)) {
            this.gameState.set(lobby_id, initGameData);
        }

        // if (!this.gameState.has(lobby_id)) {
        //     this.gameState.set(lobby_id, initGameData);
        // } else {
        //     if (this.gameState.has(lobby_id)) {
        //         const current = this.gameState.get(lobby_id);
        //         if (current?.players.indexOf(socket.id) === -1) {
        //             current?.players.push(socket.id);
        //             current?.alive_players.push(socket.id);
        //             if (current?.totalPlayers !== undefined) {
        //                 current.totalPlayers += 1;
        //             }
        //         }
        //     }
        // }
        console.log('Current room', this.gameState.get(lobby_id));

        this.io.in(lobby_id).emit("inGameUsers", users);
    }

    handleStart(socket: Socket, lobby_id: string) {
        const current = this.gameState.get(lobby_id);
        if (current && current.votes.indexOf(socket.handshake.auth.user_id) === -1) {
            current?.votes.push(socket.handshake.auth.user_id);
        }
        if (current && current.votes.length === current.totalPlayers) {
            current.votes = [];
            this.assignRoles(lobby_id);
            this.play(lobby_id);
        }
    }

    handleDayVote(socket: Socket, lobby_id: string, targetSocketId: string) {
        const current = this.gameState.get(lobby_id);
        if (current && current.alive_players.length > current.votes.length) {
            current.votes.push(targetSocketId);
            console.log('current vote tally', current.votes)
            if (current.alive_players.length === current.votes.length) {
                this.handleFinalizeVote(lobby_id, 'day');
            }
            this.io.to(socket.id).emit('received')
        }
    }

    handleFinalizeVote(lobby_id: string, stage: string) {
        const current = this.gameState.get(lobby_id);
        const voteCount = new Map<string, number>();
        if (current) {
            console.log(current.votes);
            current.votes.forEach((vote) => {
                if (vote !== null) {
                    const targetId = vote;
                    let count = voteCount.get(targetId);
                    if (count !== undefined) {
                        voteCount.set(targetId, count + 1);
                    } else {
                        voteCount.set(targetId, 1);
                    }
                }
            })
            current.votes = new Array();
            console.log(voteCount)
            
            let maxVote = 0;
            let targets: string[] = [];
            
            for (const [targetId, count] of voteCount.entries()) {
                console.log(targetId, count)
                if (count > maxVote) {
                    maxVote = count;
                    targets = [targetId];
                } else if (count === maxVote) {
                    targets.push(targetId);
                }
            }
            
            if (targets.length === 1) {
                const votedPlayer = targets[0];
                console.log('voted player:', votedPlayer);
                const finalTargetIndex = current.alive_players.findIndex((player) => player === votedPlayer);
                if (finalTargetIndex !== -1) {
                    current.alive_players.splice(finalTargetIndex, 1);
                }
                if (current.werewolves.findIndex((player) => player === votedPlayer) !== -1) {
                    current.werewolf_side_left -= 1;
                } else if (current.villagers.findIndex((player) => player === votedPlayer) !== -1 || 
                current.seers === votedPlayer) {
                    current.villager_side_left -= 1;
                }
                if (stage == 'day') {
                    this.logStatus(lobby_id);
                    this.io.in(lobby_id).emit('targetVoted', votedPlayer);
                } else if (stage == 'night') {
                    this.logStatus(lobby_id);
                    this.io.in(lobby_id).emit('targetKilled', votedPlayer);
                }
            } else {
                this.io.in(lobby_id).emit('tieVote');
            }
            console.log(this.gameState.get(lobby_id));
        }

        // this.logStatus(lobby_id);
    }

    handleWerewolfSelect(socket: Socket, lobby_id: string, targetSocketId: string) {
        const current = this.gameState.get(lobby_id);
        if (current && current.werewolf_side_left > current.votes.length) {
            current.votes.push(targetSocketId);
            console.log('current vote tally', current.votes)
            if (current.werewolf_side_left === current.votes.length) {
                this.handleFinalizeVote(lobby_id, 'night');
            }
            this.io.to(socket.id).emit('received')
        }
    }

    handleSeer(socket: Socket, lobby_id: string, id: string) {
        let role;
        const current = this.gameState.get(lobby_id);
        if (current?.alive_players.indexOf(socket.handshake.auth.userId) === -1) {
            this.io.to(socket.id).emit('seerResult', id, 'seer dead');
        } else if (current) {
            if (current.villagers.indexOf(id) !== -1) {
                role = 'Villager'
            } else if (current.werewolves.indexOf(id) !== -1) {
                role = 'Werewolf'
            } else {
                role = 'Seer'
            }
        }
        this.io.to(socket.id).emit('seerResult', id, role);
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
        console.log(current);

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
                                current.seers = id;
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

    // Night phase
    performNightActions(lobby_id: string) {
        // Werewolf
        this.startKillingTimer(lobby_id, 30);
        // while (true) {
        //     const selectedPlayerIndex = Math.floor(Math.random() * this.alive_players.length);
        //     const selectedPlayer = this.alive_players[selectedPlayerIndex];
        //     if (selectedPlayer.role !== Role.Werewolf) {
        //         this.alive_players.splice(selectedPlayerIndex, 1);
        //         selectedPlayer.alive = false;
        //         this.villager_side_left -= 1;
        //         if (selectedPlayer.role === Role.Seer) {
        //             this.seer_left -= 1;
        //         }
        //         console.log(`${selectedPlayer.name} was killed by werewolves`)
        //         break;
        //     }
        // }

        // Seer
        // const current = this.gameState.get(lobby_id);
        // if (current && current?.seer_left > 0) {
        //     // this.startCheckingTimer(10);
        // }
        // if (this.seer_left > 0) {
        //     const i = Math.floor(Math.random() * this.alive_players.length);
        //     const selected = this.alive_players[i];
        //     if (selected.role === Role.Werewolf) {
        //         console.log(`${selected.name} is on werewolf side`);
        //     } else {
        //         console.log(`${selected.name} is on villager side`);
        //     }
        // }
    }

    performSeerActions(lobby_id: string) {
        this.startCheckingTimer(lobby_id, 20);
    }

    performDayActions(lobby_id: string) {
        this.startVotingTimer(lobby_id, 30);
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
    }

    handleNextStage(socket: Socket, lobby_id: string) {
        this.toNextStages.set(lobby_id, true);
    }

    play(lobby_id: string) {
        console.log('game start');
        this.toNextStages.set(lobby_id, false);
        // this.performDayActions(lobby_id);
        while (true) {
            if (!this.isGameOver(lobby_id)) {
                this.performDayActions(lobby_id);
                console.log('day action')
                while (this.toNextStages.get(lobby_id) === false) {}
                this.toNextStages.set(lobby_id, false);
                // while (this.votingTimers.has(lobby_id)) {}
                // this.logStatus(lobby_id);
            } else {
                break;
            }

            if (!this.isGameOver(lobby_id)) {
                this.performNightActions(lobby_id);
                console.log('night action')
                while (this.toNextStages.get(lobby_id) === false) {}
                this.toNextStages.set(lobby_id, false);
                // while (this.killingTimers.has(lobby_id)) {}
                // this.logStatus(lobby_id);
            } else {
                break;
            }

            if (!this.isGameOver(lobby_id)) {
                this.performSeerActions(lobby_id);
                console.log('seer action')
                while (this.toNextStages.get(lobby_id) === false) {}
                this.toNextStages.set(lobby_id, false);
                // while (this.checkingTimers.has(lobby_id)) {}
                // this.logStatus(lobby_id);
            } else {
                break;
            }
        }
        console.log('game ended');
        const current = this.gameState.get(lobby_id);
        if (current) {
            if (current.werewolf_side_left === 0) {
                this.io.in(lobby_id).emit('villagerWin')
            } else {
                this.io.in(lobby_id).emit('werewolfWin')                
            }
            this.gameState.delete(lobby_id);
            this.toNextStages.delete(lobby_id);
        }
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
    }

    startVotingTimer(lobby_id: string, duration: number) {
        let timer = duration;
        const interval = setInterval(() => {
            timer--;

            if (timer <= 0) {
                clearInterval(interval);
                // this.io.in(lobby_id).emit('votingEnded');
                const current = this.gameState.get(lobby_id)?.players;
                if (current) {
                    for (let [id, socket] of this.io.of("/").sockets) {
                        if (current.indexOf(socket.handshake.auth.user_id) !== -1) {
                            this.io.to(id).emit('votingEnded');
                        }
                    }
                }
                this.votingTimers.delete(lobby_id);
                return true
                // this.handleFinalizeVote(lobby_id)
            } else {
                const current = this.gameState.get(lobby_id)?.players;
                if (current) {
                    for (let [id, socket] of this.io.of("/").sockets) {
                        if (current.indexOf(socket.handshake.auth.user_id) !== -1) {
                            this.io.to(id).emit('votingTimer', timer);
                        }
                    }
                }
                // this.io.in(lobby_id).emit('votingTimer', timer);
            }
        }, 1000);

        this.votingTimers.set(lobby_id, interval);
    }

    startKillingTimer(lobby_id: string, duration: number) {
        let timer = duration;
        const interval = setInterval(() => {
            timer--;

            if (timer <= 0) {
                clearInterval(interval);
                // this.io.in(lobby_id).emit('killingEnded');
                const current = this.gameState.get(lobby_id)?.players;
                if (current) {
                    for (let [id, socket] of this.io.of("/").sockets) {
                        if (current.indexOf(socket.handshake.auth.user_id) !== -1) {
                            this.io.to(id).emit('killingEnded');
                        }
                    }
                }
                this.killingTimers.delete(lobby_id);
                return true
                // this.handleFinalizeVote(lobby_id)
            } else {
                const current = this.gameState.get(lobby_id)?.players;
                if (current) {
                    for (let [id, socket] of this.io.of("/").sockets) {
                        if (current.indexOf(socket.handshake.auth.user_id) !== -1) {
                            this.io.to(id).emit('killingTimer', timer);
                        }
                    }
                }
                // this.io.in(lobby_id).emit('killingTimer', timer);
            }
        }, 1000);

        this.killingTimers.set(lobby_id, interval);
    }

    startCheckingTimer(lobby_id: string, duration: number) {
        let timer = duration;
        const interval = setInterval(() => {
            timer--;

            if (timer <= 0) {
                clearInterval(interval);
                // this.io.in(lobby_id).emit('checkingEnded');
                const current = this.gameState.get(lobby_id)?.players;
                if (current) {
                    for (let [id, socket] of this.io.of("/").sockets) {
                        if (current.indexOf(socket.handshake.auth.user_id) !== -1) {
                            this.io.to(id).emit('checkingEnded');
                        }
                    }
                }
                this.checkingTimers.delete(lobby_id);
                return true
                // this.handleFinalizeVote(lobby_id)
            } else {
                // this.io.in(lobby_id).emit('checkingTimer', timer);
                const current = this.gameState.get(lobby_id)?.players;
                if (current) {
                    for (let [id, socket] of this.io.of("/").sockets) {
                        if (current.indexOf(socket.handshake.auth.user_id) !== -1) {
                            this.io.to(id).emit('checkingTimer', timer);
                        }
                    }
                }
            }
        }, 1000);

        this.checkingTimers.set(lobby_id, interval);
    }

    isGameOver(lobby_id: string) {
        const current = this.gameState.get(lobby_id);
        if (current) {
            if (current.villager_side_left === current.werewolf_side_left || current.werewolf_side_left === 0) {
                return true;
            }
            return false;
        }
    }

    logStatus(lobby_id: string) {
        const current = this.gameState.get(lobby_id);

        if (current) {
            const users: any[] = [];
            let room = this.io.sockets.adapter.rooms.get(lobby_id);
            if (room) {
                console.log('room found')
                console.log(room)
                const currentP = this.gameState.get(lobby_id)?.players;

                for (let [id, socket] of this.io.of("/").sockets) {
                    if (currentP?.indexOf(socket.handshake.auth.user_id) !== -1) {
                        let role;
                        if (current.villagers.indexOf(id) !== -1) {role = Role.Villager;}
                        else if (current.werewolves.indexOf(id) !== -1) {role = Role.Werewolf;}
                        else {role = Role.Seer;}
                        const info = {
                            socketID: id,
                            username: socket.handshake.auth.username,
                            userId: socket.handshake.auth.user_id,
                            role: role,
                            alive: current.alive_players.indexOf(id) !== -1,
                        }
                        this.io.to(id).emit('updateStatus', info);
                        users.push(info);
                    }
                }
            } else {console.log('not found')}
            console.log(users);
        }
    }
}