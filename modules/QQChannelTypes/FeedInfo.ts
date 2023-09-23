/** 话题频道帖子数据 */


type int64 = number;
type int32 = number;
type ResourceInfo = {
    /** 帖子附带的图片列表 */
    "images": FeedMedia[],
    /** 帖子附带的视频列表 */
    "videos": FeedMedia[]
}
type FeedMedia = {
    /** 媒体ID */
    "file_id": string,
    /** 控件ID?(不确定) */
    "pattern_id": string,
    /** 媒体链接 */
    "url": string,
    /** 媒体高度 */
    "height": int32,
    /** 媒体宽度 */
    "width": int32
}
type PosterInfo = {
    /** 发帖人ID */
    "tiny_id": string,
    /** 发帖人昵称 */
    "nickname": string,
    /** 发帖人头像链接 */
    "icon_url": string
}
type FeedContent = {
    "type": "text"
    "data": { "text": string }
} | {
    "type": "face",
    "data": { "id": number }
} | {
    "type": "at",
    "data": {
        "id": string,
        /** 此qq和id属性一样,文档说:为确保和 array message 的一致性保留 */
        "qq": string
    }
} | {
    "type": "url_quote",
    "data": {
        /** 显示文本 */
        "display_text": string,
        /** 网页链接 */
        "url": string
    }
} | {
    "type": "channel_quote",
    "data": {
        /** 显示文本 */
        "display_text": string,
        /** 频道ID */
        "guild_id": string,
        /** 子频道ID */
        "channel_id": string
    }
}

export class FeedInfo {
    constructor(private obj: {
        /** 帖子标识符 */
        "id": string,
        /** 子频道ID */
        "channel_id": string,
        /** 频道ID */
        "guild_id": string,
        /** 发帖时间 */
        "create_time": int64,
        /** 帖子标题 */
        "title": string,
        /** 帖子副标题 */
        "sub_title": string,
        /** 发帖人信息 */
        "poster_info": PosterInfo,
        /** 媒体资源信息 */
        "resource": ResourceInfo,
        /** 帖子内容 */
        "contents": FeedContent[]
    }) { }

    /** 帖子标识符 */
    get id() { return this.obj.id; }
    /** 子频道ID */
    get channel_id() { return this.obj.channel_id; }
    /** 频道ID */
    get guild_id() { return this.obj.guild_id; }
    /** 发帖时间 */
    get create_time() { return this.obj.create_time; }
    /** 帖子标题 */
    get title() { return this.obj.title; }
    /** 帖子副标题 */
    get sub_title() { return this.obj.sub_title; }
    /** 发帖人信息 */
    get poster_info() { return this.obj.poster_info; }
    /** 媒体资源信息 */
    get resource() { return this.obj.resource; }
    /** 帖子内容 */
    get contents() { return this.obj.contents; }

    toString() {
        return `<Class:${this.constructor.name}>\n${JSON.stringify(this.obj, null, 2)}`;
    }
}