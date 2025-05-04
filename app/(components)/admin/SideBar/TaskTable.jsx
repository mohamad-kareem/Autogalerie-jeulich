// components/TaskTable.jsx
const TaskTable = ({ tasks }) => (
  <div className="overflow-x-auto mt-6">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 text-left">Name</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Priority</th>
          <th className="p-3 text-left">Created On</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="p-3">{task.name}</td>
            <td className="p-3">
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-700">
                {task.status}
              </span>
            </td>
            <td className="p-3">
              <span
                className={`px-2 py-1 rounded bg-${
                  task.priority === "High"
                    ? "red"
                    : task.priority === "Medium"
                    ? "yellow"
                    : "green"
                }-100 text-${
                  task.priority === "High"
                    ? "red"
                    : task.priority === "Medium"
                    ? "yellow"
                    : "green"
                }-700`}
              >
                {task.priority}
              </span>
            </td>
            <td className="p-3">{task.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TaskTable;
