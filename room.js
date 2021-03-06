const win_module = require("./win_controller")
const logger = require("./logger")

class Room {
    constructor(io, name, password, board_size, player_limit, piece_streak) {
        this.io = io;
        this.name = name;
        this.id = this.generateId();
        this.password = password;
        this.size = board_size;
        this.board = this.generate_board(board_size);
        this.piece_streak = piece_streak;
        this.player_limit = player_limit;
        this.connected_players = [];
        this.possible_pieces = [
            "cross",
            "circle",
            "triangle",
            "square"
        ];
        this.turn = 0;
        setInterval(() => {
            this.updateClients()
        }, 500)
    }
    getCurrentPlayer() {
        if(this.connected_players.length == 0) return "none"
        let count = 0;
        let player_index = 0;
        while (count < this.turn) {
            count += 1;
            player_index += 1;
            if(player_index >= this.connected_players.length) {
                player_index = 0;
            }
        }
        return this.connected_players[player_index]
    }
    getNextPlayer() {
        if(this.connected_players.length == 0) return "none"
        let count = -1;
        let player_index = 0;
        while (count < this.turn) {
            count += 1;
            player_index += 1;
            if(player_index >= this.connected_players.length) {
                player_index = 0;
            }
        }
        return this.connected_players[player_index]
    }
    generateId() {
        let id = "";
        for (let index = 0; index < 8; index++) {
            id += Math.floor(Math.random() * 10)
        }
        return id;
    }
    generate_board(size) {
        let board = []
        for (let y = 0; y < size; y++) {
            board.push([])
            for (let x = 0; x < size; x++) {
                board[y].push({
                    piece: "none"
                })
                
            }
        }
        return board
    }
    getPlayerBySocketId(socket_id) {
        let player = this.connected_players.find(element => element.socket.id == socket_id)
        return player
    }
    getPlayerByPiece(piece) {
        let player = this.connected_players.find(element => element.piece == piece)
        return player
    }
    getAvailablePieces() {
        let available_pieces = this.possible_pieces.slice();
        this.connected_players.forEach(player => {
            const piece = player.piece;
            let piece_index = available_pieces.indexOf(piece)
            available_pieces.splice(piece_index, 1)
        });
        return available_pieces;
    }
    addPlayer(socket, password) {
        if(this.connected_players.length >= this.player_limit) return socket.emit("error", "The room is full")
        if(this.password != password) return socket.emit("wrong_password")
        let available_pieces = this.getAvailablePieces();
        let piece = available_pieces[Math.floor(Math.random() * (Math.abs(available_pieces.length)))]
        
        socket.join(this.id)
        this.connected_players.push({socket: socket, piece: piece})
        logger.info(`user [${socket.id}] has joined room [${this.id}] as [${piece}]`)
    }
    removePlayer(socket_id) {
        let player_index = this.connected_players.findIndex(player => player.socket.id == socket_id)
        this.connected_players[player_index].socket.leave(this.id)
        this.connected_players.splice(player_index, 1)
        logger.info(`user [${socket_id}] on room [${this.id}] was removed from the room`)
    }
    getPlayerCount() {
        return this.connected_players.length
    }
    isProtected() {
        if(this.password.length == 0) return false
        return true
    }
    updateClients() {
        this.io.to(this.id).emit("game_update", {
            
            board: this.board,
            current_player: this.getCurrentPlayer().piece,
            next_player: this.getNextPlayer().piece
        })
        logger.info(`users on room [${this.id}] were sent the current game state`)
        
    }
    makeMove(socket, x, y) {
        const player = this.getPlayerBySocketId(socket.id);
        const turn_player = this.getCurrentPlayer()
        if(this.board[y][x].piece != "none") {
            socket.emit("alert-error", "You can't play in occupied squares");
            logger.info(`user [${socket.id}] on room [${this.id}] tried to move [${turn_player.piece}] to [${x};${y}] but it's occupied`)
            return
        }
        if(turn_player.socket.id != player.socket.id) {
            socket.emit("alert-error", "It's Not your turn")
            logger.info(`user [${socket.id}] on room [${this.id}] tried to move [${turn_player.piece}] to [${x};${y}] but it's not their turn`)
            return
        }
        this.board[y][x].piece = player.piece;
        
        if(this.checkWin(x, y)) {
            this.io.to(this.id).emit("game_end", {
            winner_id: turn_player.socket.id,
            winner_piece: this.getCurrentPlayer().piece
        })
        logger.info(`user [${socket.id}] on room [${this.id}] moved [${turn_player.piece}] to [${x};${y}] and WON`)
    }
        this.turn += 1;
        
        logger.info(`user [${socket.id}] on room [${this.id}] moved [${turn_player.piece}] to [${x};${y}]`)
    }
    checkWin(x, y) {
        if(win_module.checkHorizontalWin(this.board, this.piece_streak, x, y)) return true
        if(win_module.checkVerticalWin(this.board, this.piece_streak, x, y)) return true
        if(win_module.checkDiagonalRightWin(this.board, this.piece_streak, x, y)) return true
        if(win_module.checkDiagonalLeftWin(this.board, this.piece_streak, x, y)) return true
    }
    resetGame() {
        this.board = this.generate_board(this.size);
        this.turn = 0;
        logger.info(`user [${socket.id}] on room [${this.id}] moved [${turn_player.piece}] to [${x};${y}] and WON`)
    }
}

module.exports.Room = Room;