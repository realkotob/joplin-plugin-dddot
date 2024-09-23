import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { ToolInfo } from "../types/toolinfo";
import { DragItemType } from "../types/drag";
import { SmallIconButton } from "../views/smalliconbutton";
import { ExpandButton } from "../views/expandbutton";

type Props = {
    tool: ToolInfo;
    index: number;
    moveListItem: (dragIndex: number, hoverIndex: number) => void;
    children?: React.ReactNode;
}

export function useSectionState(props: Props) {
    const {
        tool,
        index,
        moveListItem,
        children,
    } = props;

    const [isExpanded, setIsExpanded] = React.useState(true);

    const [{ isDragging }, dragRef, dragPreviewRef] = useDrag({
        type: DragItemType.Section,
        item: { tool, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    const ref = React.useRef(null);

    const [_, dropRef] = useDrop({
        accept: DragItemType.Section,
        hover: (item: any, monitor) => {
            // Ref: https://dev.to/crishanks/transfer-lists-with-react-dnd-3ifo
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === undefined) return;
            if (dragIndex === hoverIndex) return;
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const hoverActualY = monitor.getClientOffset().y - hoverBoundingRect.top;

            // if dragging down, continue only when hover is smaller than middle Y
            if (dragIndex < hoverIndex && hoverActualY < hoverMiddleY) return;
            // if dragging up, continue only when hover is bigger than middle Y
            if (dragIndex > hoverIndex && hoverActualY > hoverMiddleY) return;

            moveListItem(dragIndex, hoverIndex);
            // eslint-disable-next-line no-param-reassign
            item.index = hoverIndex;
        },
    });

    const itemRef = dragPreviewRef(dropRef(ref));

    const onExpandClick = React.useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    const onBackgroundClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail >= 2 && e.detail % 2 === 0) {
            setIsExpanded((prev) => !prev);
        }
    }, []);

    return {
        tool,
        itemRef,
        dragRef,
        dragPreviewRef,
        isExpanded,
        setIsExpanded,
        onExpandClick,
        isDragging,
        children,
        onBackgroundClick,
        index, // Return index to make sure it could trigger SecionImpl to re-render after DnD
    };
}

export function SectionImpl(props: ReturnType<typeof useSectionState>) {
    const {
        tool,
        onExpandClick,
        itemRef,
        isDragging,
        onBackgroundClick,
    } = props;

    const opacity = isDragging ? 0 : 1;

    return (
        <div data-id={tool.key} id={tool.containerId}
            ref={itemRef} style={{ opacity }}>
            <div class="dddot-tool-header" ref={props.dragRef} onClick={onBackgroundClick}>
                <h3><i class="fas fa-bars"></i> {tool.title}</h3>
                <div className="flex flex-row center justify-center h-full">
                    {
                        tool.extraButtons.map((button, index) => (
                            <React.Fragment key={index}>
                                <SmallIconButton icon={button.icon}
                                    tooltip={button.tooltip}
                                    onClick={() => {
                                        DDDot.postMessage(button.message);
                                    }}
                                />
                            </React.Fragment>
                        ))
                    }
                    <ExpandButton
                        isExpanded={props.isExpanded}
                        onClick={onExpandClick}
                    />
                </div>
            </div>
            {
                props.isExpanded && (
                    <div id={tool.contentId}>
                        {props.children}
                    </div>
                )
            }
        </div>
    );
}

export function Section(props: Props) {
    const states = useSectionState(props);
    return <SectionImpl {...states} />;
}
