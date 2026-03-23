import { Editor, Gantt, IApi, Toolbar, Willow } from "@svar-ui/react-gantt";
import { useState } from "react";

const tasks = [
  {
    id: 1,
    text: "Project Planning",
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 10),
    progress: 100,
    type: "summary",
    open: true,
  },
  {
    id: 2,
    text: "Requirements Gathering",
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 5),
    progress: 100,
    parent: 1,
  },
  
];

const links = [{ id: 1, source: 2, target: 3, type: "e2s" }];

const scales = [
  { unit: "month", step: 1, format: "%M %Y" },
  { unit: "week", step: 1, format: "Week %w" },
  {unit: "day", step: 1, format: "%d %M" },
  //{ unit: "day", step: 1, format: "day %w" },
];

const GanttChart = () => {
  const [api, setApi] = useState<IApi | undefined>(undefined);
  console.log(api);
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Willow>
        <Toolbar api={api} />
        <Gantt tasks={tasks} links={links} scales={scales} init={setApi} />
        {api && <Editor api={api} />}
      </Willow>
    </div>
  );
};

export default GanttChart;
