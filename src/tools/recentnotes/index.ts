import { SettingItemType } from "api/types";
import { t } from "i18next";
import Tool from "../tool";
import LinkListModel from "../../models/linklistmodel";
import Link from "../../types/link";
import { ItemChangeEventType } from "../../repo/joplinrepo";

const RecentNotesContentSetting = "dddot.settings.recentnotes.content";
const RecentNotesMaxNotesSetting = "dddot.settings.recentnotes.maxnotes";
const RecentNotesShowFullPathSetting = "dddot.settings.recentnotes.showfullpath";
const RecentNotesMaxNotesSettingDefaultValue = 5;
const RecentNotesShowFullPathSettingDefaultValue = false;

export default class RecentNotes extends Tool {
    linkListModel: LinkListModel = new LinkListModel();

    settings(section: string) {
        return {
            [RecentNotesContentSetting]: {
                value: [],
                type: SettingItemType.Object,
                public: false,
                label: "Recent Notes",
                section,
            },
            [RecentNotesMaxNotesSetting]: {
                value: RecentNotesMaxNotesSettingDefaultValue,
                type: SettingItemType.Bool,
                public: true,
                label: "Recent Notes - Show full path for notes",
                section,
            },
            [RecentNotesShowFullPathSetting]: {
                value: RecentNotesShowFullPathSettingDefaultValue,
                type: SettingItemType.Int,
                public: true,
                label: "Recent Notes - Max number of notes",
                section,
            },
        };
    }

    async start() {
        this.linkListModel.rehydrate(await this.joplinRepo.settingsLoad(
            RecentNotesContentSetting,
            [],
        ));

        await this.joplinRepo.workspaceOnNoteSelectionChange(async () => {
            const activeNote = await this.joplinRepo.workspaceSelectedNote();
            await this.insertLink(activeNote);
        });

        await this.joplinRepo.workspaceOnNoteChange(async (change) => {
            const { id, event } = change;
            if (event === ItemChangeEventType.Update) {
                const note = await this.joplinService.getNote(id);
                const {
                    title,
                } = note;
                if (this.linkListModel.update(id, { title })) {
                    await this.save();
                    this.refresh();
                }
            }
        });
    }

    async save() {
        await this.joplinRepo.settingsSave(
            RecentNotesContentSetting,
            this.linkListModel.dehydrate(),
        );
    }

    async refresh() {
        const html = this.render();

        const message = {
            type: "recentnotes.refresh",
            html,
        };

        this.joplinRepo.panelPostMessage(message);
    }

    async insertLink(note) {
        const prependLink = Link.createNoteLinkFromRawData(note);

        this.linkListModel.unshift(prependLink);

        await this.truncate();
        await this.save();
        await this.refresh();
    }

    async onMessage(message: any) {
        switch (message.type) {
        case "recentnotes.onReady":
            return this.onReady();
        case "recentnotes.tool.openNoteDetailDialog":
            return this.openNoteDetailDialog(message.noteId);
        default:
            break;
        }
        return undefined;
    }

    async openNoteDetailDialog(noteId: string) {
        const {
            noteDialogService,
        } = this.servicePool;

        await noteDialogService.open(noteId);
    }

    get title() {
        return t("recentnotes.title");
    }

    async onReady() {
        await this.truncate();
        return await this.render();
    }

    async truncate() {
        const maxVisibleItemCount = await this.joplinRepo.settingsLoad(
            RecentNotesMaxNotesSetting,
            RecentNotesMaxNotesSettingDefaultValue,
        );
        this.linkListModel.links = this.linkListModel.links.slice(0, maxVisibleItemCount);
    }

    async render() {
        const { links } = this.linkListModel;
        const {
            rendererService,
        } = this.servicePool;

        const showFullPath = await this.joplinRepo.settingsLoad(
            RecentNotesShowFullPathSetting,
            RecentNotesShowFullPathSettingDefaultValue,
        );

        if (showFullPath) {
            // Change the title to the title + parent folder name
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                const parentFolder = await this.joplinRepo.dataGet(["folders", link.parentId], {fields: ["id", "title"]});
                link.finalTitle = `${parentFolder.title}/(${link.title})`;
            }
        } else {
            // Change the title to the title + parent folder name
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                link.finalTitle = link.title;
            }
        }

        const list = links.map((note: Link) => {
            const link = rendererService.renderNoteLink(
                note.id,
                note.finalTitle,
                {
                    onClick: {
                        type: "dddot.openNote",
                        noteId: note.id,
                    },
                    onContextMenu: {
                        type: "recentnotes.tool.openNoteDetailDialog",
                        noteId: note.id,
                    },
                    isTodo: note.isTodo,
                    isTodoCompleted: note.isTodoCompleted,
                },
            );
            return link;
        });
        const html = ["<div class=dddot-note-list>", ...list, "</div>"];
        return html.join("\n");
    }

    get key() {
        return "recentnotes";
    }
}
