import { getGanttTasksByMilestoneId } from "@/app/action/task.actions";
import { Button } from "@/components/ui/button";
import useTaskModal from "@/app/hooks/use-task-modal";
import { PlusIcon } from "lucide-react";
import { Editor, Gantt, IApi, Toolbar, Willow } from "@svar-ui/react-gantt";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router";

type GanttTask = {
  id: number;
  text: string;
  start: string | Date;
  end: string | Date;
  progress: number;
  type?: string;
  open?: boolean;
  parent?: number;
};

const links: never[] = [];

const scales = [
  { unit: "month", step: 1, format: "%M %Y" },
  { unit: "week", step: 1, format: "Week %w" },
  {unit: "day", step: 1, format: "%d %M" },
  //{ unit: "day", step: 1, format: "day %w" },
];

const GanttChart = () => {
  const { milestoneId } = useParams();

  const { data } = useQuery({
    queryKey: ["ganttTasksByMilestoneId", milestoneId],
    queryFn: () => getGanttTasksByMilestoneId(milestoneId || ""),
    enabled: Boolean(milestoneId),
  });
  const { setType, onOpen, setMilestoneid } = useTaskModal();

  const tasks = useMemo(
    () =>
      ((data as GanttTask[] | undefined) || []).map((task) => ({
        ...task,
        start: new Date(task.start),
        end: new Date(task.end),
      })),
    [data],
  );

  const [api, setApi] = useState<IApi | undefined>(undefined);

  return (
    <div className="overflow-scroll max-w-[100%]">
      <Willow>
        {/* <div className="flex overflow-scroll items-center justify-between px-3 py-2">
          <h2 className="text-lg font-semibold">Milestone Gantt</h2>
          <Button
            size="sm"
            onClick={() => {
              if (!milestoneId) {
                return;
              }

              setMilestoneid(milestoneId);
              setType("add");
              onOpen();
            }}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="ml-2">Add Task</span>
          </Button>
        </div> */}
        
        <Gantt tasks={tasks}  links={links} scales={scales} init={setApi} />
        {/* {api && <Editor api={api} />} */}
      </Willow>
    </div>
  );
};

export default GanttChart;
