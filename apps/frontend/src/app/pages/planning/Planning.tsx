import { Calendar, GanttChart } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Gantt,
  Task,
  EventOption,
  StylingOption,
  ViewMode,
  DisplayOption,
} from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { KanbanComponent, ColumnsDirective, ColumnDirective } from "@syncfusion/ej2-react-kanban";

export default function Planning() {
  let data = [
        { Id: 1, Status: 'Open', Summary: 'Analyze the new requirements gathered from the customer.', Type: 'Story', Priority: 'Low', Tags: 'Analyze,Customer', Estimate: 3.5, Assignee: 'Nancy Davloio', RankId: 1 },
        { Id: 2, Status: 'InProgress', Summary: 'Fix the issues reported in the IE browser.', Type: 'Bug', Priority: 'Release Breaker', Tags: 'IE', Estimate: 2.5, Assignee: 'Janet Leverling', RankId: 2  },
        { Id: 3, Status: 'Testing', Summary: 'Fix the issues reported by the customer.', Type: 'Bug', Priority: 'Low', Tags: 'Customer', Estimate: '3.5', Assignee: 'Steven walker', RankId: 1 },
        { Id: 4, Status: 'Close', Summary: 'Arrange a web meeting with the customer to get the login page requirements.', Type: 'Others', Priority: 'Low', Tags: 'Meeting', Estimate: 2, Assignee: 'Michael Suyama', RankId: 1 },
        { Id: 5, Status: 'Validate', Summary: 'Validate new requirements', Type: 'Improvement', Priority: 'Low', Tags: 'Validation', Estimate: 1.5, Assignee: 'Robert King', RankId: 1 }
    ];
  let tasks: Task[] = [
    {
      start: new Date(2020, 1, 1),
      end: new Date(2020, 1, 4),
      name: "Idea",
      id: "Task 0",
      type: "task",
      progress: 45,
      isDisabled: false,
      styles: { progressColor: "#ffbb54", progressSelectedColor: "#ff9e0d" },
    },
    {
      start: new Date(2020, 1, 3),
      end: new Date(2020, 1, 4),
      name: "Research",
      dependencies: ["Task 0"],
      
      id: "Task 1",
      type: "task",
      progress: 25,
    },
    {
      start: new Date(2020, 1, 5),
      end: new Date(2020, 1, 6),
      name: "Development",
      id: "Task 2",
      type: "project",
      progress: 10,
    },
    {
      start: new Date(2020, 1, 7),
      end: new Date(2020, 1, 8),
      name: "Testing",
      id: "Task 3",
      type: "project",
       
      progress: 0,
    },
    {
      start: new Date(2020, 1, 9),
      end: new Date(2020, 1, 10),
      name: "Deployment",
      id: "Task 4",
      type: "milestone",
      progress: 0,
    },
    {
      start: new Date(2020, 1, 11),
      end: new Date(2020, 1, 12),
      name: "Maintenance",
      id: "Task 5",
      type: "task",
      progress: 10,
      hideChildren: true,
      project: "Task 2",
    },
    {
      start: new Date(2020, 1, 13),
      end: new Date(2020, 1, 14),
      name: "Review",
      id: "Task 6",
      type: "task",
      progress: 0,
    }
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Planning & Scheduling
        </h1>
        <p className="text-gray-500 mt-1">
          Interactive Gantt chart and task management
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
           <Gantt 
          onTaskDelete={()=>console.log("deleted")}
          type="milestone"
          onClick={(e)=>console.log(e)}

          tasks={tasks}
          ViewMode={ViewMode.Month}
          
          />    
         

          {/* <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <GanttChart className="h-16 w-16 mb-4 text-gray-300" />
            <p>Interactive Gantt chart will be displayed here</p>
            <p className="text-sm mt-2">
              Featuring task dependencies, critical path, and resource
              allocation
            </p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
