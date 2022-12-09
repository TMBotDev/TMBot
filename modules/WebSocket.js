"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketClient = exports.WebsocketServer = exports.CustomConnection = exports.Event = void 0;
const http_1 = require("http");
const ws = __importStar(require("websocket"));
const deasync_1 = __importDefault(require("deasync"));
const logger_1 = require("../tools/logger");
let logger = new logger_1.Logger("WebsocketClient", 4);
class Event {
    constructor(funcList = {}) {
        this.funcList = funcList;
        this.num = 0;
    }
    on(func) {
        let name = (() => {
            try {
                return (func.name || (func.toString().match(/function\s*([^(]*)\(/))[1]) + `(${this.num++})`;
            }
            catch (_) {
                return `_NOT_FUNCTION_NAME_(${this.num++})`;
            }
        })();
        this.funcList[name] = func;
        return name;
    }
    un(name) {
        delete this.funcList[name];
        return true;
    }
    clear() {
        this.funcList = {};
        return true;
    }
    size() {
        return Object.keys(this.funcList).length;
    }
    fire(api, ...params) {
        let keys = Object.keys(this.funcList);
        let l = keys.length, i = 0;
        while (i < l) {
            let func = this.funcList[keys[i]];
            try {
                func(...params);
            }
            catch (e) {
                logger.error(`Error in: ${api}(${keys[i]})`);
                logger.error(e.stack);
            }
            i++;
        }
    }
}
exports.Event = Event;
class CustomConnection extends ws.connection {
}
exports.CustomConnection = CustomConnection;
class WebsocketServer {
    constructor(port) {
        this.port = port;
        this._Events = {
            "connection": new Event()
        };
        this._IdMap = {};
        this._clients = new Map();
        let nowId = 0;
        this._httpServer = (0, http_1.createServer)((req, res) => {
            let id = nowId++;
            this._IdMap[id] = { req, res };
            req.on("close", () => {
                delete this._IdMap[id];
            });
            res.writeHead(404);
            res.end();
        });
        this._wss = new ws.server({ "httpServer": this._httpServer, "autoAcceptConnections": false });
        this._wss.on("request", (req) => {
            let socket = req.accept();
            if (!!this._Events.connection) {
                this._Events.connection.fire("WebsocketServer_Connection", socket, req);
            }
        });
        let status = true;
        this._httpServer.listen(port, () => {
            status = false;
        });
        while (status) {
            deasync_1.default.sleep(100);
        }
        this._Events.connection.on((socket, _req) => {
            let id = (nowId++).toString();
            this._clients.set(id, socket);
            socket.ID = id;
            socket.on("close", (_code, _desc) => {
                this._clients.delete(id);
            });
        });
    }
    on(eventName, func) {
        if (this._Events[eventName] !== undefined) {
            this._Events[eventName].on(func);
            return true;
        }
        return false;
    }
    getClients() {
        let obj = {};
        let iters = this._clients.entries(), iter = iters.next();
        while (!iter.done) {
            obj[iter.value[0]] = iter.value[1];
            iter = iters.next();
        }
        return obj;
    }
    close(cb) {
        setInterval(() => {
            for (let key in this._IdMap) {
                let obj = this._IdMap[key];
                obj.req.destroy();
            }
        }, 100);
        this._httpServer.close(cb);
    }
    ;
}
exports.WebsocketServer = WebsocketServer;
class WebsocketClient {
    constructor(connect) {
        this.connect = connect;
        this._events = {
            "onStart": new Event(),
            "onMsg": new Event(),
            "onClose": new Event(),
            "onError": new Event()
        };
        this._client = new ws.client();
        this._Init();
        this._client.connect(connect);
        // logger.info("Connect:", connect);
    }
    get client() {
        return this._client;
    }
    _Init() {
        this._client.on("connect", (conn) => {
            this._conn = conn;
            logger.info("服务器连接成功!");
            conn.on("message", (msg) => {
                if (msg.type == "utf8") {
                    this._events.onMsg.fire("WebsocketProcessUTF8Message", msg.utf8Data, false);
                }
                else {
                    this._events.onMsg.fire("WebsocketProcessBINARYMessage", msg.binaryData, true);
                }
            });
            conn.on("error", (err) => { this._events.onError.fire("WebsocketProcessError", err); });
            conn.on("close", (code, desc) => { this._events.onClose.fire("WebsocketProcessClose", code, desc); });
            this._events.onStart.fire("WebsocketProcessStart");
        });
        this._client.on("connectFailed", (err) => {
            this._events.onError.fire("WebsocketProcessFailed", err);
            // logger.error("ConnectFailed! ", err.stack);
        });
    }
    get events() { return this._events; }
    send(msg) {
        if (!this._conn) {
            return false;
        }
        this._conn.send(msg, (err) => { if (!!err) {
            this._events.onError.fire("WebsocketProcessSendError", err);
        } });
    }
    /**
     * 不要随便使用此api
     * @param code
     * @returns
     */
    close(code = 1000) {
        if (!this._conn) {
            return false;
        }
        logger.info("Close Code:", code);
        this._conn.close(code, "NORMAL");
        return true;
    }
}
exports.WebsocketClient = WebsocketClient;
