// import { createServer, IncomingMessage, Server, ServerResponse } from "http";
// import deasync from "deasync";
// import * as websocket_ts from "websocket-ts";
import { WebSocket } from "ws";
import { Logger } from "../tools/logger";

let logger = new Logger("WebsocketClient", 4);

export class Event<FUNCTION_T extends (...args: any[]) => void>{
    private num = 0;
    constructor(
        private funcList: { [key: string]: FUNCTION_T } = {}
    ) { }
    on(func: FUNCTION_T) {
        let name = (() => {
            try {
                return (func.name || (func.toString().match(/function\s*([^(]*)\(/))![1]) + `(${this.num++})`;
            } catch (_) {
                return `_NOT_FUNCTION_NAME_(${this.num++})`;
            }
        })();
        this.funcList[name] = func;
        return name;
    }
    un(name: string) {
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
    fire(api: string, ...params: Parameters<FUNCTION_T>) {
        let keys = Object.keys(this.funcList);
        let l = keys.length, i = 0;
        while (i < l) {
            let func = this.funcList[keys[i]];
            try {
                func(...params);
            } catch (e) {
                logger.error(`Error in: ${api}(${keys[i]})`);
                logger.error((e as Error).stack);
            }
            i++;
        }
    }
}

// export class CustomConnection extends ws.connection {
//     public ID: string | undefined;
// }

// export class WebsocketServer {
//     private _Events = {
//         "connection": new Event<(_socket: CustomConnection, _req: ws.request) => void>()
//     };
//     private _IdMap: { [key: number]: { "req": IncomingMessage, "res": ServerResponse<IncomingMessage> } } = {};
//     private _httpServer: Server<typeof IncomingMessage, typeof ServerResponse>;
//     private _wss: ws.server;
//     private _clients = new Map<string, CustomConnection>();
//     constructor(
//         protected port: number) {
//         let nowId = 0;
//         this._httpServer = createServer((req, res) => {
//             let id = nowId++;
//             this._IdMap[id] = { req, res };
//             req.on("close", () => {
//                 delete this._IdMap[id];
//             });
//             res.writeHead(404);
//             res.end();
//         });
//         this._wss = new ws.server({ "httpServer": this._httpServer, "autoAcceptConnections": false });
//         this._wss.on("request", (req) => {
//             let socket = req.accept();
//             if (!!this._Events.connection) {
//                 this._Events.connection.fire("WebsocketServer_Connection", socket as CustomConnection, req);
//             }
//         });
//         let status = true;
//         this._httpServer.listen(port, () => {
//             status = false;
//         });
//         while (status) {
//             deasync.sleep(100);
//         }
//         this._Events.connection.on((socket, _req) => {
//             let id = (nowId++).toString();
//             this._clients.set(id, socket);
//             socket.ID = id;
//             socket.on("close", (_code, _desc) => {
//                 this._clients.delete(id);
//             });
//         });
//     }
//     on(eventName: "connection", func: (socket: ws.connection, request: ws.request) => void) {
//         if (this._Events[eventName] !== undefined) {
//             this._Events[eventName].on(func);
//             return true;
//         }
//         return false;
//     }
//     getClients() {
//         let obj: { [id: string]: CustomConnection } = {};
//         let iters = this._clients.entries(),
//             iter = iters.next();
//         while (!iter.done) {
//             obj[iter.value[0]] = iter.value[1];
//             iter = iters.next();
//         }
//         return obj;
//     }
//     close(cb: (err: Error | undefined) => void) {
//         setInterval(() => {
//             for (let key in this._IdMap) {
//                 let obj = this._IdMap[key];
//                 obj.req.destroy();
//             }
//         }, 100);
//         this._httpServer.close(cb);
//     };
// }

export class WebsocketClient {
    private _client: WebSocket;
    // private _conn: websocket_ts.Websocket | undefined;
    private _events = {
        "onStart": new Event<() => void>(),
        "onMsg": new Event<(msg: string | Buffer, isBuffer: boolean) => void>(),
        "onClose": new Event<(code: number, desc: string) => void>(),
        "onError": new Event<(err: Error) => void>()
    }
    constructor(private connect: string) {
        this._client = new WebSocket(connect);
        this._Init();
        // this._client.connect(connect);
        // logger.info("Connect:", connect);
    }
    get client() {
        return this._client;
    }
    reConnect() {
        this._client = new WebSocket(this.connect);
        this._Init();
    }
    _Init() {
        this._client.onopen = (_e) => {
            logger.info("服务器连接成功!");
            this._events.onStart.fire("WebsocketProcessStart");
        };
        this._client.onmessage = (e) => {
            let isBuffer = typeof (e.data) != "string";
            if (!isBuffer) {
                this._events.onMsg.fire("WebsocketProcessUTF8Message", e.data as string, isBuffer);
            } else {
                this._events.onMsg.fire("WebsocketProcessBINARYMessage", e.data as Buffer, isBuffer);
            }
        };
        this._client.onclose = (e) => {
            this._events.onClose.fire("WebsocketProcessClose", e.code, e.reason);
        };
        this._client.onerror = (e) => {
            this._events.onError.fire("WebsocketProcessFailed", e.error as Error);
            //logger.error("ConnectFailed! ", err.stack);
        };
        // this._conn = this._client.();
        // this._client.on("connect", (conn) => {
        //     this._conn = conn;
        //     logger.info("服务器连接成功!");
        //     conn.on("message", (msg: ws.Message) => {
        //         if (msg.type == "utf8") {
        //             this._events.onMsg.fire("WebsocketProcessUTF8Message", msg.utf8Data, false);
        //         } else {
        //             this._events.onMsg.fire("WebsocketProcessBINARYMessage", msg.binaryData, true);
        //         }
        //     });
        //     conn.on("error", (err) => { this._events.onError.fire("WebsocketProcessError", err); });
        //     conn.on("close", (code, desc) => { this._events.onClose.fire("WebsocketProcessClose", code, desc); });
        //     this._events.onStart.fire("WebsocketProcessStart");
        // });
        // this._client.on("connectFailed", (err) => {
        //     this._events.onError.fire("WebsocketProcessFailed", err);
        //     // logger.error("ConnectFailed! ", err.stack);
        // });

    }
    get events() { return this._events; }
    send(msg: string | Buffer) {
        // if (!this._conn) { return false; }
        // this._conn.send(msg, (err) => { if (!!err) { this._events.onError.fire("WebsocketProcessSendError", err); } });
        // this._conn.send(msg);
        this._client.send(msg);
    }
    /**
     * 不要随便使用此api
     * @param code 
     * @returns 
     */
    close(code: number = 1000) {
        // if (!this._conn) { return false; }
        logger.info("Close Code:", code);
        // this._conn.close(code, "NORMAL");
        // this._conn.close(code);
        this._client.close(code);
        return true;
    }
}