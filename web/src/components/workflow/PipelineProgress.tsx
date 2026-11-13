import { stages, type Stage } from "@/lib/pipeline/types";

export type Progress = Partial<Record<Stage, { status: "running" | "complete"; message: string }>>;
export default function PipelineProgress({ progress, paused = false }: { progress: Progress; paused?: boolean }) {
  return <ol className="pipeline-progress" aria-label="Analysis progress">
    {stages.map((stage, index) => {
      const activity = progress[stage.id];
      return <li key={stage.id} className={activity?.status ?? "pending"} aria-current={activity?.status === "running" ? "step" : undefined}>
        <span className="stage-number">{activity?.status === "complete" ? "✓" : index + 1}</span>
        <div><strong>{stage.label}</strong><p>{activity?.status === "complete" ? activity.message : activity?.status === "running" ? paused ? "Needs your attention" : activity.message : "Waiting for the previous stage"}</p></div>
        <span className="stage-state">{activity?.status === "complete" ? "Done" : activity?.status === "running" ? paused ? "Paused" : "Working" : ""}</span>
      </li>;
    })}
  </ol>;
}
