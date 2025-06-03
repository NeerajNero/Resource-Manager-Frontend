// src/pages/Projects.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { format } from "date-fns";
import apiClient from "../api/appClient";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredSkills: string[];
  teamSize: number;
  status: "planning" | "active" | "completed";
  managerId: {
    _id: string;
    name: string;
    email: string;
  };
}

type ProjectFormInputs = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredSkills: string;
  teamSize: number;
  status: "planning" | "active" | "completed";
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "planning" | "active" | "completed">("all");
  const { register, handleSubmit, reset } = useForm<ProjectFormInputs>({
    defaultValues: { status: "planning", teamSize: 1 },
  });
  const user = useAuthStore((state) => state.user)!;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Project[]>("/projects");
        setProjects(res.data);
      } catch (err) {
        console.error("Error fetching projects:", err);
        toast.error("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const onSubmit: SubmitHandler<ProjectFormInputs> = async (data) => {
    try {
      const projectPayload = {
        name: data.name.trim(),
        description: data.description.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        requiredSkills: data.requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length),
        teamSize: data.teamSize,
        status: data.status,
      };

      await apiClient.post("/projects", projectPayload);
      toast.success("Project created successfully");
      reset();

      const res = await apiClient.get<Project[]>("/projects");
      setProjects(res.data);
    } catch (err: any) {
      console.error("Error creating project:", err);
      toast.error(err.response?.data?.message || "Creation failed");
    }
  };

  // 1) Filter projects by status
  const filteredProjects = projects.filter(
    (p) => filterStatus === "all" || p.status === filterStatus
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">
          Projects (Manager: {user.name})
        </h1>

        {/* Status Filter Dropdown */}
        <div className="mb-4 flex items-center space-x-2">
          <label htmlFor="statusFilter" className="font-medium">
            Filter by status:
          </label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "planning" | "active" | "completed")
            }
            className="px-3 py-2 border rounded"
          >
            <option value="all">All</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading projects…</p>
        ) : filteredProjects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Dates</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Team Size</th>
                  <th className="px-4 py-2 text-left">Required Skills</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="px-4 py-2">
                      <Link
                        to={`/projects/${p._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {format(new Date(p.startDate), "MMM d, yyyy")} –{" "}
                      {format(new Date(p.endDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-2 capitalize">{p.status}</td>
                    <td className="px-4 py-2">{p.teamSize}</td>
                    <td className="px-4 py-2">
                      {p.requiredSkills.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              {...register("name", { required: true })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              {...register("description", { required: true })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
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
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              {...register("requiredSkills", { required: true })}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. React, Node.js, Python"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Team Size</label>
              <input
                type="number"
                {...register("teamSize", {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                {...register("status", { required: true })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default Projects;
