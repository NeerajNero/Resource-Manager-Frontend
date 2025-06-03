// src/pages/ProjectDetails.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/appClient";
import { format } from "date-fns";
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

interface Assignment {
  _id: string;
  engineerId: {
    _id: string;
    name: string;
    email: string;
  };
  projectId: {
    _id: String
  }
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingProject, setLoadingProject] = useState<boolean>(false);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [skillGap, setSkillGap] = useState<{
    requiredSkills: string[];
    assignedSkills: string[];
    missingSkills: string[];
  } | null>(null);
  const [loadingSkillGap, setLoadingSkillGap] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    requiredSkills: string;
    teamSize: number;
    status: "planning" | "active" | "completed";
  }>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    requiredSkills: "",
    teamSize: 1,
    status: "planning",
  });

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      setLoadingProject(true);
      try {
        const res = await apiClient.get<Project>(`/projects/${id}`);
        setProject(res.data);
        setFormData({
          name: res.data.name,
          description: res.data.description,
          startDate: res.data.startDate.slice(0, 10),
          endDate: res.data.endDate.slice(0, 10),
          requiredSkills: res.data.requiredSkills.join(", "),
          teamSize: res.data.teamSize,
          status: res.data.status,
        });
      } catch (err) {
        console.error("Error fetching project:", err);
        toast.error("Failed to load project details.");
      } finally {
        setLoadingProject(false);
      }
    };

    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const res = await apiClient.get<Assignment[]>("/assignments");
        const projectAssignments = res.data.filter(
          (a) => a.projectId._id === id
        );
        setAssignments(projectAssignments);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        toast.error("Failed to load assignments for this project.");
      } finally {
        setLoadingAssignments(false);
      }
    };

    const fetchSkillGap = async () => {
      setLoadingSkillGap(true);
      try {
        const res = await apiClient.get<{
          projectId: string;
          requiredSkills: string[];
          assignedSkills: string[];
          missingSkills: string[];
        }>(`/projects/${id}/skill-gap`);
        setSkillGap({
          requiredSkills: res.data.requiredSkills,
          assignedSkills: res.data.assignedSkills,
          missingSkills: res.data.missingSkills,
        });
      } catch (err) {
        console.error("Error fetching skill gap:", err);
      } finally {
        setLoadingSkillGap(false);
      }
    };

    fetchProject();
    fetchAssignments();
    fetchSkillGap();
  }, [id]);

  if (loadingProject || !project) {
    return <p>Loading project details…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      {/* Edit Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
        >
          {isEditing ? "Cancel Edit" : "Edit Project"}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-2">Edit Project</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payload = {
                  name: formData.name.trim(),
                  description: formData.description.trim(),
                  startDate: formData.startDate,
                  endDate: formData.endDate,
                  requiredSkills: formData.requiredSkills
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length),
                  teamSize: formData.teamSize,
                  status: formData.status,
                };
                const res = await apiClient.put(`/projects/${id}`, payload);
                setProject(res.data);
                setIsEditing(false);
                toast.success("Project updated successfully");
              } catch (err) {
                console.error("Error updating project:", err);
                toast.error((err as any).response?.data?.message || "Update failed");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
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
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      endDate: e.target.value,
                    }))
                  }
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
                value={formData.requiredSkills}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    requiredSkills: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g. React, Node.js, Python"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Team Size
                </label>
                <input
                  type="number"
                  value={formData.teamSize}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      teamSize: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      status: e.target.value as any,
                    }))
                  }
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
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Project Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <p className="text-sm text-gray-600">Description:</p>
          <p className="text-gray-700">{project.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Start Date:</p>
            <p>{format(new Date(project.startDate), "MMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date:</p>
            <p>{format(new Date(project.endDate), "MMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status:</p>
            <p className="capitalize">{project.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Team Size:</p>
            <p>{project.teamSize}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Required Skills:</p>
          <p>{project.requiredSkills.join(", ")}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Manager:</p>
          <p>
            {project.managerId.name} ({project.managerId.email})
          </p>
        </div>
      </div>

      {/* Assignments for this project */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Assignments</h2>
        {loadingAssignments ? (
          <p>Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p>No engineers assigned to this project yet.</p>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Engineer</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Allocation</th>
                <th className="px-4 py-2 text-left">Dates</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-2">{a.engineerId.name}</td>
                  <td className="px-4 py-2">{a.role}</td>
                  <td className="px-4 py-2">{a.allocationPercentage}%</td>
                  <td className="px-4 py-2">
                    {format(new Date(a.startDate), "MMM d, yyyy")} –{" "}
                    {format(new Date(a.endDate), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Skill-Gap Analysis */}
      {skillGap && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Skill-Gap Analysis</h2>

          {loadingSkillGap ? (
            <p>Computing skill gap…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Required Skills:</p>
                <p>{skillGap.requiredSkills.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Assigned Engineers’ Skills:
                </p>
                <p>{skillGap.assignedSkills.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Missing Skills:</p>
                <p className="text-red-600">
                  {skillGap.missingSkills.length > 0
                    ? skillGap.missingSkills.join(", ")
                    : "No gaps — all skills covered."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
