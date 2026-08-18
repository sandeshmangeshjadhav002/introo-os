import { useState } from "react";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

export default function KanbanBoard({
  columns = [],
  stages = [],
  onCardClick,
  onAddCard,
  onColumnDrop,
  onCardDrop,
  onEditDeal,
  onArchiveDeal,
  onDeleteDeal,
}) {
  // Support both interfaces — either raw `columns` from the generic board,
  // or `stages` from DealsPage where each stage has a .deals array.
  const normalizedColumns =
    stages && stages.length > 0
      ? stages.map((stage) => ({
          ...stage,
          cards:
            stage.deals?.map((deal) => ({
              ...deal,
              id: deal.id,
              title: deal.name || deal.title,
              description: deal.description,
              amount: deal.amount ?? deal.value,
              priority: deal.priority,
              _raw: deal,
            })) || [],
        }))
      : columns;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {normalizedColumns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onCardClick={(card) => {
            if (onCardClick) return onCardClick(card);
            if (onEditDeal) return onEditDeal(card._raw || card);
          }}
          onAddCard={onAddCard}
          onCardDrop={onCardDrop}
          onEditDeal={onEditDeal}
          onArchiveDeal={onArchiveDeal}
          onDeleteDeal={onDeleteDeal}
        />
      ))}
    </div>
  );
}

function KanbanColumn({ column, onCardClick, onAddCard, onCardDrop }) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const cardId = e.dataTransfer.getData("cardId");
    const fromColumnId = e.dataTransfer.getData("fromColumnId");
    if (cardId && onCardDrop) {
      onCardDrop(cardId, fromColumnId, column.id);
    }
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="flex items-center justify-between mb-3 px-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || "#6366f1" }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {column.title}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {column.cards?.length || 0}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onAddCard && (
            <button
              onClick={() => onAddCard(column.id)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 min-h-[400px] transition-colors ${
          isOver ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          {column.cards?.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              onClick={() => onCardClick?.(card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ card, columnId, onClick }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("cardId", card.id);
    e.dataTransfer.setData("fromColumnId", columnId);
  };

  return (
    <motion.div
      layoutId={`card-${card.id}`}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {card.title}
          </h4>
          {card.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {card.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            {card.amount && (
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${card.amount.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-2">
              {card.priority && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    card.priority === "urgent"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : card.priority === "high"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : card.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {card.priority}
                </span>
              )}
            </div>
          </div>
        </div>
        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
      </div>
    </motion.div>
  );
}
