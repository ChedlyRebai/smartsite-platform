/* eslint-disable unicorn/no-null */

import {
  Link,
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
  Trash2Icon,
  Warehouse,
} from "lucide-react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import type {
  KanbanBoardCircleColor,
  KanbanBoardDropDirection,
} from "@/components/kanban";
import {
  KANBAN_BOARD_CIRCLE_COLORS,
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardDescription,
  KanbanBoardCardTextarea,
  KanbanBoardColumn,
  KanbanBoardColumnButton,
  kanbanBoardColumnClassNames,
  KanbanBoardColumnFooter,
  KanbanBoardColumnHeader,
  KanbanBoardColumnIconButton,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  kanbanBoardColumnListItemClassNames,
  KanbanBoardColumnSkeleton,
  KanbanBoardColumnTitle,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  KanbanColorCircle,
  useDndEvents,
} from "@/components/kanban";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uuid } from "zod";
import { useJsLoaded } from "@/hooks/use-js-loaded";
import { CardHeader, CardTitle, CardContent, Card } from "@/components/ui/card";
import { Task, TaskStatusEnum } from "@/app/types";
import { useQuery } from "@tanstack/react-query";
import { deleteTask, getTasksBYMilestoneId } from "@/app/action/planing.action";
import { useParams } from "react-router";
import useTaskModal from "@/app/hooks/use-task-modal";
import { de } from "zod/v4/locales";
import useTaskDetailsModal from "@/app/hooks/use-task-details-modal";
import { useAuthStore } from "@/app/store/authStore";
import { getCurrentUserTask } from "@/app/action/task.actions";

type Column = {
  id: string;
  title: TaskStatusEnum;
  description?: string;
  color: KanbanBoardCircleColor;
  tasks: Task[];
};

export default function MyTask() {
  const { milestoneId } = useParams();
  console.log("my token")
  console.log(localStorage.getItem("smartsite"));
  
  return (
    <div className="space-y-6">
      <div className="flex tasks-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Milestone</h1>
          <p className="text-gray-500 mt-1">
            Manage site relationships and orders
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex tasks-center gap-2">
            <Warehouse className="h-5 w-5" />
            Milestone Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid h-screen grid-rows-[var(--header-height)_1fr_6rem] overflow-x-hidden sm:grid-rows-[var(--header-height)_1fr_var(--header-height)]">
            <main className="relative">
              <div className="absolute inset-0 h-full overflow-x-hidden px-4 py-4 md:px-6">
                <KanbanBoardProvider>
                  <MyKanbanBoard />
                </KanbanBoardProvider>
              </div>
            </main>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MyKanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const {user,getCurrentUser}=useAuthStore();
  console.log(user.access_token);
  const { milestoneId } = useParams();
  
  const { data, isLoading } = useQuery({
    queryKey: ["getCurrentUserTask"],
    queryFn: async () => {
      const response = await getCurrentUserTask();
      console.log(response);
      setColumns(response);
    },
  });
  console.log(data);

  // Scroll to the right when a new column is added.
  const scrollContainerReference = useRef<HTMLDivElement>(null);

  function scrollRight() {
    if (scrollContainerReference.current) {
      scrollContainerReference.current.scrollLeft =
        scrollContainerReference.current.scrollWidth;
    }
  }

  /*
  Column logic
  */

  const handleAddColumn = (title?: TaskStatusEnum) => {
    if (title) {
      flushSync(() => {
        setColumns((previousColumns) => [
          ...previousColumns,
          {
            id: uuid.toString(),
            title,
            color:
              KANBAN_BOARD_CIRCLE_COLORS[previousColumns.length] ?? "primary",
            tasks: [],
          },
        ]);
      });
    }

    scrollRight();
  };

  function handleDeleteColumn(columnId: string) {
    flushSync(() => {
      setColumns((previousColumns) =>
        previousColumns.filter((column) => column.id !== columnId),
      );
    });

    scrollRight();
  }

  function handleUpdateColumnTitle(columnId: string, title: TaskStatusEnum) {
    setColumns((previousColumns) =>
      previousColumns.map((column) =>
        column.id === columnId ? { ...column, title } : column,
      ),
    );
  }

  /*
  Task logic
  */

  //   function handleAddCard(columnId: string, cardContent: string) {
  //     setColumns((previousColumns) =>
  //       previousColumns.map((column) =>
  //         column.id === columnId
  //           ? {
  //               ...column,
  //               tasks: [
  //                 ...column.tasks,
  //                 { id: uuid.toString(), title: cardContent },
  //               ],
  //             }
  //           : column,
  //       ),
  //     );
  //   }

  async function handleDeleteCard(cardId: string) {
    // setColumns((previousColumns) =>
    //   previousColumns.map((column) =>
    //     column.tasks.some((card) => card._id === cardId)
    //       ? { ...column, tasks: column.tasks.filter(({ _id }) => _id !== cardId) }
    //       : column,
    //   ),
    // );
    const response = await deleteTask(cardId);
    console.log(response);
    if (response.status === 200) {
      setColumns((previousColumns) =>
        previousColumns.map((column) =>
          column.tasks.some((card) => card._id === cardId)
            ? {
                ...column,
                tasks: column.tasks.filter(({ _id }) => _id !== cardId),
              }
            : column,
        ),
      );
    }
  }

  function handleMoveCardToColumn(columnId: string, index: number, card: Task) {
    setColumns((previousColumns) =>
      previousColumns.map((column) => {
        if (column.id === columnId) {
          console.log(column.tasks);
          // Remove the card from the column (if it exists) before reinserting it.
          const updatedItems = column.tasks.filter(
            ({ _id }) => _id !== card._id,
          );
          console.log(card);
          card.status = column.title;
          return {
            ...column,
            tasks: [
              // Items before the insertion index.
              ...updatedItems.slice(0, index),
              // Insert the card.
              card,
              // Items after the insertion index.
              ...updatedItems.slice(index),
            ],
          };
        } else {
          // Remove the card from other columns.
          return {
            ...column,
            tasks: column.tasks.filter(({ _id }) => _id !== card._id),
          };
        }
      }),
    );
  }

  function handleUpdateCardTitle(cardId: string, cardTitle: string) {
    setColumns((previousColumns) =>
      previousColumns.map((column) =>
        column.tasks.some((card: Task) => card._id === cardId)
          ? {
              ...column,
              tasks: column.tasks.map((card) =>
                card._id === cardId ? { ...card, title: cardTitle } : card,
              ),
            }
          : column,
      ),
    );
  }

  /*
  Moving cards with the keyboard.
  */
  const [activeCardId, setActiveCardId] = useState<string>("");
  const originalCardPositionReference = useRef<{
    columnId: string;
    cardIndex: number;
  } | null>(null);
  const { onDragStart, onDragEnd, onDragCancel, onDragOver } = useDndEvents();

  // This helper returns the appropriate overId after a card is placed.
  // If there's another card below, return that card's id, otherwise return the column's id.
  function getOverId(column: Column, cardIndex: number): string {
    if (cardIndex < column.tasks.length - 1) {
      return column.tasks[cardIndex + 1]._id;
    }

    return column.id;
  }

  // Find column and index for a given card.
  function findCardPosition(cardId: string): {
    columnIndex: number;
    cardIndex: number;
  } {
    for (const [columnIndex, column] of columns.entries()) {
      const cardIndex = column.tasks.findIndex((c) => c._id === cardId);

      if (cardIndex !== -1) {
        return { columnIndex, cardIndex };
      }
    }

    return { columnIndex: -1, cardIndex: -1 };
  }

  function moveActiveCard(
    cardId: string,
    direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown",
  ) {
    const { columnIndex, cardIndex } = findCardPosition(cardId);
    if (columnIndex === -1 || cardIndex === -1) return;

    const card = columns[columnIndex].tasks[cardIndex];

    let newColumnIndex = columnIndex;
    let newCardIndex = cardIndex;

    switch (direction) {
      case "ArrowUp": {
        newCardIndex = Math.max(cardIndex - 1, 0);

        break;
      }
      case "ArrowDown": {
        newCardIndex = Math.min(
          cardIndex + 1,
          columns[columnIndex].tasks.length - 1,
        );

        break;
      }
      case "ArrowLeft": {
        newColumnIndex = Math.max(columnIndex - 1, 0);
        // Keep same cardIndex if possible, or if out of range, insert at end
        newCardIndex = Math.min(
          newCardIndex,
          columns[newColumnIndex].tasks.length,
        );

        break;
      }
      case "ArrowRight": {
        newColumnIndex = Math.min(columnIndex + 1, columns.length - 1);
        newCardIndex = Math.min(
          newCardIndex,
          columns[newColumnIndex].tasks.length,
        );

        break;
      }
    }

    // Perform state update in flushSync to ensure immediate state update.
    flushSync(() => {
      handleMoveCardToColumn(columns[newColumnIndex].id, newCardIndex, card);
    });

    // Find the card's new position and announce it.
    const { columnIndex: updatedColumnIndex, cardIndex: updatedCardIndex } =
      findCardPosition(cardId);
    const overId = getOverId(columns[updatedColumnIndex], updatedCardIndex);

    onDragOver(cardId, overId);
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) {
    const { key } = event;

    if (activeCardId === "" && key === " ") {
      // Pick up the card.
      event.preventDefault();
      setActiveCardId(cardId);
      onDragStart(cardId);

      const { columnIndex, cardIndex } = findCardPosition(cardId);
      originalCardPositionReference.current =
        columnIndex !== -1 && cardIndex !== -1
          ? { columnId: columns[columnIndex].id, cardIndex }
          : null;
    } else if (activeCardId === cardId) {
      // Task is already active.
      // eslint-disable-next-line unicorn/prefer-switch
      if (key === " " || key === "Enter") {
        event.preventDefault();
        // Drop the card.
        flushSync(() => {
          setActiveCardId("");
        });

        const { columnIndex, cardIndex } = findCardPosition(cardId);
        if (columnIndex !== -1 && cardIndex !== -1) {
          const overId = getOverId(columns[columnIndex], cardIndex);
          onDragEnd(cardId, overId);
        } else {
          // If we somehow can't find the card, just call onDragEnd with cardId.
          onDragEnd(cardId);
        }

        originalCardPositionReference.current = null;
      } else if (key === "Escape") {
        event.preventDefault();

        // Cancel the drag.
        if (originalCardPositionReference.current) {
          const { columnId, cardIndex } = originalCardPositionReference.current;
          const {
            columnIndex: currentColumnIndex,
            cardIndex: currentCardIndex,
          } = findCardPosition(cardId);

          // Revert card only if it moved.
          if (
            currentColumnIndex !== -1 &&
            (columnId !== columns[currentColumnIndex].id ||
              cardIndex !== currentCardIndex)
          ) {
            const card = columns[currentColumnIndex].tasks[currentCardIndex];
            flushSync(() => {
              handleMoveCardToColumn(columnId, cardIndex, card);
            });
          }
        }

        onDragCancel(cardId);
        originalCardPositionReference.current = null;

        setActiveCardId("");
      } else if (
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
      ) {
        event.preventDefault();
        moveActiveCard(cardId, key);
        // onDragOver is called inside moveActiveCard after placement.
      }
    }
  }

  function handleCardBlur() {
    setActiveCardId("");
  }

  const jsLoaded = useJsLoaded();

  return (
    <KanbanBoard ref={scrollContainerReference}>
      {columns.map((column) =>
        jsLoaded ? (
          <MyKanbanBoardColumn
            activeCardId={activeCardId}
            column={column}
            key={column.id}
            onCardBlur={handleCardBlur}
            onCardKeyDown={handleCardKeyDown}
            onDeleteCard={handleDeleteCard}
            onDeleteColumn={handleDeleteColumn}
            onMoveCardToColumn={handleMoveCardToColumn}
            onUpdateCardTitle={handleUpdateCardTitle}
            onUpdateColumnTitle={handleUpdateColumnTitle}
          />
        ) : (
          <KanbanBoardColumnSkeleton key={column.id} />
        ),
      )}

      {/* Add a new column */}
      {/* {jsLoaded ? (
        <MyNewKanbanBoardColumn onAddColumn={handleAddColumn} />
      ) : (
        <Skeleton className="h-9 w-10.5 flex-shrink-0" />
      )} */}

      <KanbanBoardExtraMargin />
    </KanbanBoard>
  );
}

function MyKanbanBoardColumn({
  activeCardId,
  column,
  onAddCard,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onDeleteColumn,
  onMoveCardToColumn,
  onUpdateCardTitle,
  onUpdateColumnTitle,
}: {
  activeCardId: string;
  column: Column;
  onAddCard?: (columnId: string, cardContent: string) => void;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onMoveCardToColumn: (columnId: string, index: number, card: Task) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
  onUpdateColumnTitle: (columnId: string, columnTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const listReference = useRef<HTMLUListElement>(null);
  const moreOptionsButtonReference = useRef<HTMLButtonElement>(null);
  const { onDragCancel, onDragEnd } = useDndEvents();

  function scrollList() {
    if (listReference.current) {
      listReference.current.scrollTop = listReference.current.scrollHeight;
    }
  }

  function closeDropdownMenu() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    moreOptionsButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get("columnTitle") as string;
    onUpdateColumnTitle(column.id, columnTitle);
    closeDropdownMenu();
  }

  function handleDropOverColumn(dataTransferData: string) {
    const card = JSON.parse(dataTransferData) as Task;
    onMoveCardToColumn(column.id, 0, card);
  }

  function handleDropOverListItem(cardId: string) {
    return (
      dataTransferData: string,
      dropDirection: KanbanBoardDropDirection,
    ) => {
      const card = JSON.parse(dataTransferData) as Task;
      const cardIndex = column.tasks.findIndex(({ _id }) => _id === cardId);
      const currentCardIndex = column.tasks.findIndex(
        ({ _id }) => _id === card._id,
      );

      const baseIndex = dropDirection === "top" ? cardIndex : cardIndex + 1;
      const targetIndex =
        currentCardIndex !== -1 && currentCardIndex < baseIndex
          ? baseIndex - 1
          : baseIndex;

      // Safety check to ensure targetIndex is within bounds
      const safeTargetIndex = Math.max(
        0,
        Math.min(targetIndex, column.tasks.length),
      );
      const overCard = column.tasks[safeTargetIndex];

      if (card._id === overCard?._id) {
        onDragCancel(card._id);
      } else {
        onMoveCardToColumn(column.id, safeTargetIndex, card);
        onDragEnd(card._id, overCard?._id || column.id);
      }
    };
  }

  return (
    <KanbanBoardColumn
      columnId={column.id}
      key={column.id}
      onDropOverColumn={handleDropOverColumn}
    >
      <KanbanBoardColumnHeader>
        {isEditingTitle ? (
          <form
            className="w-full"
            onSubmit={handleSubmit}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                closeDropdownMenu();
              }
            }}
          >
            <Input
              aria-label="Column title"
              autoFocus
              defaultValue={column.title}
              name="columnTitle"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeDropdownMenu();
                }
              }}
              required
            />
          </form>
        ) : (
          <>
            <KanbanBoardColumnTitle columnId={column.id}>
              <KanbanColorCircle color={column.color} />
              {column.title}
            </KanbanBoardColumnTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <KanbanBoardColumnIconButton ref={moreOptionsButtonReference}>
                  {/* <MoreHorizontalIcon /> */}
                  <span className="sr-only">
                    More options for {column.title}
                  </span>
                </KanbanBoardColumnIconButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Column</DropdownMenuLabel>

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                    <PenIcon />
                    Edit Details
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteColumn(column.id)}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList ref={listReference}>
        {column.tasks.map((card) => (
          <KanbanBoardColumnListItem
            cardId={card._id}
            key={card._id}
            onDropOverListItem={handleDropOverListItem(card._id)}
          >
            <MyKanbanBoardCard
              card={card}
              isActive={activeCardId === card._id}
              onCardBlur={onCardBlur}
              onCardKeyDown={onCardKeyDown}
              onDeleteCard={onDeleteCard}
              onUpdateCardTitle={onUpdateCardTitle}
            />
          </KanbanBoardColumnListItem>
        ))}
      </KanbanBoardColumnList>

      <MyNewKanbanBoardCard
        column={column}
        onAddCard={onAddCard}
        scrollList={scrollList}
      />
    </KanbanBoardColumn>
  );
}

function MyKanbanBoardCard({
  card,
  isActive,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onUpdateCardTitle,
}: {
  card: Task;
  isActive: boolean;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const kanbanBoardCardReference = useRef<HTMLButtonElement>(null);
  // This ref tracks the previous `isActive` state. It is used to refocus the
  // card after it was discarded with the keyboard.
  const previousIsActiveReference = useRef(isActive);
  // This ref tracks if the card was cancelled via Escape.
  const wasCancelledReference = useRef(false);

  useEffect(() => {
    // Maintain focus after the card is picked up and moved.
    if (isActive && !isEditingTitle) {
      kanbanBoardCardReference.current?.focus();
    }

    // Refocus the card after it was discarded with the keyboard.
    if (
      !isActive &&
      previousIsActiveReference.current &&
      wasCancelledReference.current
    ) {
      kanbanBoardCardReference.current?.focus();
      wasCancelledReference.current = false;
    }

    previousIsActiveReference.current = isActive;
  }, [isActive, isEditingTitle]);

  function handleBlur() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    kanbanBoardCardReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cardTitle = formData.get("cardTitle") as string;
    onUpdateCardTitle(card._id, cardTitle);
    handleBlur();
  }

  //const { isOpen, onOpen, onClose, setType, setId, id } = useTaskModal();
  const { task, isOpen, onOpen, onClose, setTask } = useTaskDetailsModal();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  return isEditingTitle ? (
    <form onBlur={handleBlur} onSubmit={handleSubmit}>
      <KanbanBoardCardTextarea
        aria-label="Edit card title"
        autoFocus
        defaultValue={card.title}
        name="cardTitle"
        onFocus={(event) => event.target.select()}
        onInput={(event) => {
          const input = event.currentTarget as HTMLTextAreaElement;
          if (/\S/.test(input.value)) {
            // Clear the error message if input is valid
            input.setCustomValidity("");
          } else {
            input.setCustomValidity(
              "Task content cannot be empty or just whitespace.",
            );
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }

          if (event.key === "Escape") {
            handleBlur();
          }
        }}
        placeholder="Edit card title ..."
        required
      />
    </form>
  ) : (
    <KanbanBoardCard
      data={card}
      isActive={isActive}
      onBlur={onCardBlur}
      //onClick={() => setIsEditingTitle(true)}

      onKeyDown={(event) => {
        if (event.key === " ") {
          // Prevent the button "click" action on space because that should
          // be used to pick up and move the card using the keyboard.
          event.preventDefault();
        }

        if (event.key === "Escape") {
          // Mark that this card was cancelled.
          wasCancelledReference.current = true;
        }

        onCardKeyDown(event, card._id);
      }}
      ref={kanbanBoardCardReference}
    >
      <KanbanBoardCardDescription
        className="cursor-pointer hover:underline  w-fit"
        onClick={() => {
          // setId(card._id);
          setTask(card);
          onOpen();
        }}
      >
        {card.title}
      </KanbanBoardCardDescription>
      {card.status}

      {/* and start and end date */}
      {card.startDate && card.endDate && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <span>
            {new Date(card.startDate).toLocaleDateString()} -{" "}
            {new Date(card.endDate).toLocaleDateString()}
          </span>
        </div>
      )}
      <KanbanBoardCardButtonGroup
        disabled={isActive}
      ></KanbanBoardCardButtonGroup>
    </KanbanBoardCard>
  );
}

function MyNewKanbanBoardCard({
  column,
  onAddCard,
  scrollList,
}: {
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  scrollList: () => void;
}) {
  const [cardContent, setCardContent] = useState("");
  const newCardButtonReference = useRef<HTMLButtonElement>(null);
  const submitButtonReference = useRef<HTMLButtonElement>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  function handleAddCardClick() {
    flushSync(() => {
      setShowNewCardForm(true);
    });

    scrollList();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowNewCardForm(false);
      setCardContent("");
    });

    newCardButtonReference.current?.focus();
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setCardContent(event.currentTarget.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    flushSync(() => {
      onAddCard(column.id, cardContent.trim());
      setCardContent("");
    });

    scrollList();
  }

  const { isOpen, onOpen, onClose, setType } = useTaskModal();

  return showNewCardForm ? (
    <>
      <form
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            handleCancelClick();
          }
        }}
        onSubmit={handleSubmit}
      >
        <div className={kanbanBoardColumnListItemClassNames}>
          <KanbanBoardCardTextarea
            aria-label="New card content"
            autoFocus
            name="cardContent"
            onChange={handleInputChange}
            onInput={(event) => {
              const input = event.currentTarget as HTMLTextAreaElement;
              if (/\S/.test(input.value)) {
                // Clear the error message if input is valid
                input.setCustomValidity("");
              } else {
                input.setCustomValidity(
                  "Task content cannot be empty or just whitespace.",
                );
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitButtonReference.current?.click();
              }

              if (event.key === "Escape") {
                handleCancelClick();
              }
            }}
            placeholder="New post ..."
            required
            value={cardContent}
          />
        </div>

        <KanbanBoardColumnFooter>
          <Button ref={submitButtonReference} size="sm" type="submit">
            Add
          </Button>

          <Button
            onClick={handleCancelClick}
            size="sm"
            variant="outline"
            type="button"
          >
            Cancel
          </Button>
        </KanbanBoardColumnFooter>
      </form>
    </>
  ) : (
    <KanbanBoardColumnFooter></KanbanBoardColumnFooter>
  );
}

function MyNewKanbanBoardColumn({
  onAddColumn,
}: {
  onAddColumn: (columnTitle?: string) => void;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const newColumnButtonReference = useRef<HTMLButtonElement>(null);
  const inputReference = useRef<HTMLInputElement>(null);

  function handleAddColumnClick() {
    flushSync(() => {
      setShowEditor(true);
    });

    onAddColumn();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowEditor(false);
    });

    newColumnButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get("columnTitle") as string;
    onAddColumn(columnTitle);
    if (inputReference.current) {
      inputReference.current.value = "";
    }
  }

  return showEditor ? (
    <form
      className={kanbanBoardColumnClassNames}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          handleCancelClick();
        }
      }}
      onSubmit={handleSubmit}
    >
      <KanbanBoardColumnHeader>
        <Input
          aria-label="Column title"
          autoFocus
          name="columnTitle"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              handleCancelClick();
            }
          }}
          placeholder="New column title ..."
          ref={inputReference}
          required
        />
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnFooter>
        <Button size="sm" type="submit">
          Add
        </Button>

        <Button
          onClick={handleCancelClick}
          size="sm"
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </KanbanBoardColumnFooter>
    </form>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleAddColumnClick}
          ref={newColumnButtonReference}
          variant="outline"
        >
          <PlusIcon />

          <span className="sr-only">Add column</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent>Add a new column to the board</TooltipContent>
    </Tooltip>
  );
}
