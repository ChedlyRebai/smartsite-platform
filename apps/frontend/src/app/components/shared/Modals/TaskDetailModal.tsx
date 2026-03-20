import useTaskDetailsModal from '@/app/hooks/use-task-details-modal'
import React from 'react'
import Modal from './Modal'

const TaskDetailModal = () => {
    const {id,onClose,onOpen,isOpen,task}= useTaskDetailsModal()
  return (
    <Modal
      title={`Task Details - ${id ? `Task #${id}` : "New Task"}`}
      description="View  task details"
      isOpen={isOpen}
      onChange={onClose}
    >
        <div className="space-y-4">
            <p><strong>Title:</strong> {task?.title}</p>
            <p><strong>Description:</strong> {task?.description}</p>
            <p><strong>Status:</strong> {task?.status}</p>
            <p><strong>Start Date:</strong> {task?.startDate ? new Date(task.startDate).toLocaleDateString() : "N/A"}</p>
            <p><strong>End Date:</strong> {task?.endDate ? new Date(task.endDate).toLocaleDateString() : "N/A"}</p>

            {task?.assignedUsers  && task.assignedUsers.length > 0 && (
                <div>
                    <strong>Assigned Users:</strong>
                    <ul className="list-disc list-inside">
                        {task.assignedUsers.map((user, index) => (
                            <li key={index}>{user}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </Modal>
  )
}

export default TaskDetailModal