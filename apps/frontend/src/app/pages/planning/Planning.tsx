import { Calendar, GanttChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function Planning() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planning & Scheduling</h1>
        <p className="text-gray-500 mt-1">Interactive Gantt chart and task management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <GanttChart className="h-16 w-16 mb-4 text-gray-300" />
            <p>Interactive Gantt chart will be displayed here</p>
            <p className="text-sm mt-2">Featuring task dependencies, critical path, and resource allocation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
