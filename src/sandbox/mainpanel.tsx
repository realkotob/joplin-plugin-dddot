import React from "react";
import { ToolInfo } from "src/types/toolinfo";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Section } from "./section";
import { BacklinksView } from "../tools/backlinks/view";
import { RawHtml } from "./rawhtml";
import { RecentNotesView } from "../tools/recentnotes/view";
import { ShortcutsView } from "../tools/shortcuts/view";

type Props = {
  tools: ToolInfo[];
  defaultToolsOrder: string[];
}

const Views = {
    backlinks: BacklinksView,
    recentnotes: RecentNotesView,
    shortcuts: ShortcutsView,
};

let singletonRef = null as null | {
  setSectionViewProp: (tool, key, value) => void;
};

export function MainPanel(props: Props) {
    const { tools, defaultToolsOrder } = props;
    const [viewPropsMap, setSectionViewPropMap] = React.useState({} as {[key: string]: {[key:string]: any}});

    const [availableTools, setAvailableTools] = React.useState<ToolInfo[]>(
        () => tools.filter((tool) => tool.hasView).sort((a, b) => {
            let aIndex = defaultToolsOrder.indexOf(a.key);
            let bIndex = defaultToolsOrder.indexOf(b.key);
            if (aIndex < 0) {
                aIndex = defaultToolsOrder.length;
            }
            if (bIndex < 0) {
                bIndex = defaultToolsOrder.length;
            }
            return aIndex - bIndex;
        }),
    );

    const moveListItem = React.useCallback((dragIndex: number, hoverIndex: number) => {
        setAvailableTools((prev) => {
            const newValue = [...prev];
            const tmp = newValue[dragIndex];
            newValue[dragIndex] = newValue[hoverIndex];
            newValue[hoverIndex] = tmp;
            return newValue;
        });
    }, []);

    React.useEffect(() => {
        singletonRef = {
            setSectionViewProp: (tool, key, value) => {
                setSectionViewPropMap((prev) => {
                    const newViewProps = prev[tool] || {};
                    newViewProps[key] = value;
                    return {
                        ...prev,
                        [tool]: newViewProps,
                    };
                });
            },
        };
        return () => {
            singletonRef = null;
        };
    }, []);

    return (
        <DndProvider backend={HTML5Backend}>
            <div id="dddot-panel-container">
                <div id="dddot-toolbar-container"></div>
                <>
                    {
                        availableTools.map((tool: ToolInfo, index: number) => {
                            const View = Views[tool.key] ?? RawHtml;

                            return (
                                <React.Fragment key={tool.key}>
                                    <Section tool={tool} index={index} moveListItem={moveListItem}>
                                        <View {...viewPropsMap[tool.key]}/>
                                    </Section>
                                </React.Fragment>
                            );
                        })
                    }
                </>
            </div>
        </DndProvider>
    );
}

MainPanel.setSectionViewProp = (tool, key, value) => {
    singletonRef?.setSectionViewProp(tool, key, value);
};