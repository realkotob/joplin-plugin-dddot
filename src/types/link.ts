export enum LinkType {
  NoteLink = "NoteLink",
  FolderLink = "FolderLink"
}

export default class Link {
    id: string;

    title: string;

    parentId: string;

    finalTitle: string;

    type: LinkType;

    isTodo: boolean | undefined;

    isTodoCompleted: boolean | undefined;

    static rehydrate(object: any): Link|undefined {
        if (!Object.values(LinkType).includes(object.type)) {
            return undefined;
        }
        const link = new Link();
        Object.assign(link, object);
        return link;
    }

    static createNoteLink(
        id: string,
        title: string,
    ): Link {
        const link = new Link();
        link.id = id;
        link.title = title;
        link.type = LinkType.NoteLink;
        return link;
    }

    static createFolderLink(id: string, title: string): Link {
        const link = new Link();
        link.id = id;
        link.title = title;
        link.type = LinkType.FolderLink;
        return link;
    }

    static createNoteLinkFromRawData(data) {
        const link = new Link();
        link.id = data.id ?? "";
        link.title = data.title ?? "";
        link.parentId = data.parent_id ?? "";
        link.isTodo = data.is_todo === 1;
        link.isTodoCompleted = data.todo_completed > 0;
        link.type = LinkType.NoteLink;
        return link;
    }
}
