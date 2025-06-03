// src/pages/Assignments.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import apiClient from "../api/appClient";
import { useAuthStore } from "../store/useAuthStore";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Engineer {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
}

interface Assignment {
  _id: string;
  engineerId: Engineer;
  projectId: Project;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

type AssignmentFormInputs = {
  engineerId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
};

const Assignments: React.FC = () => {
  const user = useAuthStore((state) => state.user)!;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingLists, setLoadingLists] = useState<boolean>(false);
  const { register, handleSubmit, reset } = useForm<AssignmentFormInputs>({
    defaultValues: {
      allocationPercentage: 0,
      role: "",
    },
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<AssignmentFormInputs>({
    engineerId: "",
    projectId: "",
    allocationPercentage: 0,
    startDate: "",
    endDate: "",
    role: "",
  });
  // Fetch assignments (all for manager; own for engineer)
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const res = await apiClient.get<Assignment[]>("/assignments");
        if (user.role === "manager") {
          // manager sees everything
          setAssignments(res.data);
        } else {
          // engineer sees only own
          const my = res.data.filter((a) => a.engineerId._id === user.id);
          setAssignments(my);
        }
      } catch (err) {
        console.error("Error fetching assignments:", err);
        toast.error("Failed to load assignments.");
      } finally {
        setLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [user]);

  // Fetch engineers + projects for the form (manager only)
  useEffect(() => {
    if (user.role !== "manager") return;

    const fetchLists = async () => {
      setLoadingLists(true);
      try {
        const [engRes, projRes] = await Promise.all([
          apiClient.get<Engineer[]>("/engineers"),
          apiClient.get<Project[]>("/projects"),
        ]);
        setEngineers(engRes.data);
        setProjects(projRes.data);
      } catch (err) {
        console.error("Error fetching engineers or projects:", err);
        toast.error("Failed to load engineers or projects.");
      } finally {
        setLoadingLists(false);
      }
    };
    fetchLists();
  }, [user.role]);

  // Create assignment handler (managers only)
  const onSubmit: SubmitHandler<AssignmentFormInputs> = async (data) => {
    try {
      const payload = {
        engineerId: data.engineerId,
        projectId: data.projectId,
        allocationPercentage: data.allocationPercentage,
        startDate: data.startDate,
        endDate: data.endDate,
        role: data.role.trim(),
      };
      await apiClient.post("/assignments", payload);
      toast.success("Assignment created successfully");
      reset();

      // Re-fetch assignments
      const res = await apiClient.get<Assignment[]>("/assignments");
      if (user.role === "manager") {
        setAssignments(res.data);
      } else {
        const my = res.data.filter((a) => a.engineerId._id === user.id);
        setAssignments(my);
      }
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      toast.error(err.response?.data?.message || "Creation failed");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">
        {user.role === "manager" ? "Manage Assignments" : "My Assignments"}
      </h1>

      {/* Manager-only: Create Assignment Form */}
      {user.role === "manager" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Assignment</h2>
          {loadingLists ? (
            <p>Loading engineers and projects…</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Engineer
                </label>
                <select
                  {...register("engineerId", { required: true })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select engineer</option>
                  {engineers.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} ({e.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Project
                </label>
                <select
                  {...register("projectId", { required: true })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register("startDate", { required: true })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register("endDate", { required: true })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Allocation Percentage
                </label>
                <input
                  type="number"
                  {...register("allocationPercentage", {
                    required: true,
                    valueAsNumber: true,
                    min: 1,
                    max: 100,
                  })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Role (e.g. Developer, Tech Lead)
                </label>
                <input
                  type="text"
                  {...register("role", { required: true })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Role on this project"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Assignment
              </button>
            </form>
          )}
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {user.role === "manager" ? "All Assignments" : "My Assignments"}
        </h2>

        {loadingAssignments ? (
          <p>Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p>
            {user.role === "manager"
              ? "No assignments exist yet."
              : "You have no current assignments."}
          </p>
        ) : (
             <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Engineer</th>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Allocation</th>
                <th className="px-4 py-2 text-left">Dates</th>
                {user.role === "manager" && (
                  <th className="px-4 py-2 text-left">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-2">{a.engineerId.name}</td>
                  <td className="px-4 py-2">{a.projectId.name}</td>
                  <td className="px-4 py-2">{a.role}</td>
                  <td className="px-4 py-2">{a.allocationPercentage}%</td>
                  <td className="px-4 py-2">
                    {format(new Date(a.startDate), "MMM d, yyyy")} –{" "}
                    {format(new Date(a.endDate), "MMM d, yyyy")}
                  </td>
                  {user.role === "manager" && (
                    <td className="px-4 py-2 space-x-2">
                      {/* You can implement edit/delete later */}

                      <td className="px-4 py-2 space-x-2">
                        {editingId === a._id ? (
                          // Inline edit form for this row
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              try {
                                const payload = {
                                  engineerId: editData.engineerId,
                                  projectId: editData.projectId,
                                  allocationPercentage:
                                    editData.allocationPercentage,
                                  startDate: editData.startDate,
                                  endDate: editData.endDate,
                                  role: editData.role.trim(),
                                };
                                const res = await apiClient.put(
                                  `/assignments/${a._id}`,
                                  payload
                                );
                                // Update the assignment in state
                                setAssignments((prev) =>
                                  prev.map((asgn) =>
                                    asgn._id === a._id ? res.data : asgn
                                  )
                                );
                                setEditingId(null);
                                toast.success("Assignment updated successfully");
                              } catch (err: any) {
                                console.error(
                                  "Error updating assignment:",
                                  err
                                );
                                toast.error(
                                  err.response?.data?.message || "Update failed"
                                );
                              }
                            }}
                            className="flex flex-col space-y-2"
                          >
                            {/* Reuse the same inputs as the “Create” form but pre-filled */}
                            <select
                              value={editData.engineerId}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  engineerId: e.target.value,
                                }))
                              }
                              className="px-2 py-1 border rounded"
                            >
                              <option value="">Select engineer</option>
                              {engineers.map((e) => (
                                <option key={e._id} value={e._id}>
                                  {e.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editData.projectId}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  projectId: e.target.value,
                                }))
                              }
                              className="px-2 py-1 border rounded"
                            >
                              <option value="">Select project</option>
                              {projects.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>

                            <input
                              type="date"
                              value={editData.startDate}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  startDate: e.target.value,
                                }))
                              }
                              className="px-2 py-1 border rounded"
                            />

                            <input
                              type="date"
                              value={editData.endDate}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  endDate: e.target.value,
                                }))
                              }
                              className="px-2 py-1 border rounded"
                            />

                            <input
                              type="number"
                              value={editData.allocationPercentage}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  allocationPercentage: Number(e.target.value),
                                }))
                              }
                              min={1}
                              max={100}
                              className="px-2 py-1 border rounded"
                            />

                            <input
                              type="text"
                              value={editData.role}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  role: e.target.value,
                                }))
                              }
                              className="px-2 py-1 border rounded"
                            />

                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-300 text-gray-800 px-2 py-1 rounded hover:bg-gray-400 text-sm"
                                type="button"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                // Populate editData with this assignment’s current values
                                setEditData({
                                  engineerId: a.engineerId._id,
                                  projectId: a.projectId._id,
                                  allocationPercentage: a.allocationPercentage,
                                  startDate: a.startDate.slice(0, 10),
                                  endDate: a.endDate.slice(0, 10),
                                  role: a.role,
                                });
                                setEditingId(a._id);
                              }}
                              className="text-yellow-600 hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this assignment?"
                                  )
                                ) {
                                  try {
                                    await apiClient.delete(
                                      `/assignments/${a._id}`
                                    );
                                    toast.success("Assignment deleted");
                                    setAssignments((prev) =>
                                      prev.filter((asgn) => asgn._id !== a._id)
                                    );
                                  } catch (err) {
                                    console.error(
                                      "Error deleting assignment:",
                                      err
                                    );
                                    toast.error("Failed to delete");
                                  }
                                }
                              }}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
