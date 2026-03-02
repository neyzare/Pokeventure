import { useState, useEffect } from "react"
import { onGetJobData, onChooseJob, onStartMission, onCompleteMission } from "./+Page.telefunc"
import { JOBS } from "../../type/jobs"
import type { MissionData, UserJobData } from "../../type/jobs"

export default function Metiers() {
    const [jobData, setJobData] = useState<UserJobData | null>(null)
    const [missions, setMissions] = useState<MissionData[]>([])
    const [money, setMoney] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [view, setView] = useState<"main" | "choose">("main")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const res = await onGetJobData()
        setLoading(false)
        if (res.success) {
            setJobData(res.data)
            setMissions(res.missions)
            setMoney(res.money)
            if (!res.data.currentJob) setView("choose")
        } else {
            setError(res.error)
        }
    }

    const selectJob = async (jobId: string) => {
        const res = await onChooseJob(jobId)
        if (res.success) {
            await loadData()
            setView("main")
        } else {
            setError(res.error)
        }
    }

    const startMission = async () => {
        const res = await onStartMission()
        if (res.success) {
            await loadData()
        } else {
            setError(res.error)
            setTimeout(() => setError(null), 3000)
        }
    }

    const completeMission = async (missionId: string) => {
        const res = await onCompleteMission(missionId)
        if (res.success) {
            await loadData()
        } else {
            setError(res.error)
            setTimeout(() => setError(null), 3000)
        }
    }

    if (loading) {
        return <div className="text-center">Chargement...</div>
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-medium uppercase">Métiers</h1>
                <div className="badge badge-warning badge-lg gap-2">
                    <span>₽</span>
                    <span className="font-bold">{money}</span>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    <span>{error}</span>
                </div>
            )}

            {view === "choose" ? (
                <ChooseJobView onSelect={selectJob} />
            ) : (
                <MainView
                    jobData={jobData!}
                    missions={missions}
                    onStartMission={startMission}
                    onCompleteMission={completeMission}
                    onChangeJob={() => setView("choose")}
                />
            )}
        </>
    )
}

function ChooseJobView({ onSelect }: { onSelect: (jobId: string) => void }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Choisissez votre métier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(JOBS).map((job) => (
                    <div key={job.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="card-body">
                            <div className="text-5xl mb-3">{job.icon}</div>
                            <h3 className="card-title">{job.name}</h3>
                            <p>{job.description}</p>
                            <div className="flex gap-4 text-sm opacity-70 mt-2">
                                <span>💰 {job.baseReward} ₽</span>
                                <span>⏱️ {job.duration}s</span>
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <button type="button" onClick={() => onSelect(job.id)} className="btn btn-primary">
                                    Choisir
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MainView({
    jobData,
    missions,
    onStartMission,
    onCompleteMission,
    onChangeJob,
}: {
    jobData: UserJobData
    missions: MissionData[]
    onStartMission: () => void
    onCompleteMission: (id: string) => void
    onChangeJob: () => void
}) {
    const job = jobData.currentJob ? JOBS[jobData.currentJob] : null
    const pendingMission = missions.find((m) => m.status === "pending")
    const xpToNext = 1000 - (jobData.jobXp % 1000)

    return (
        <div>
            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-6xl">{job?.icon}</div>
                            <div>
                                <h2 className="card-title text-3xl">{job?.name}</h2>
                                <p className="opacity-70">{job?.description}</p>
                            </div>
                        </div>
                        <button type="button" onClick={onChangeJob} className="btn btn-sm btn-ghost">
                            Changer
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold">Niveau {jobData.level}</span>
                            <progress
                                className="progress progress-primary w-full"
                                value={(jobData.jobXp % 1000)}
                                max="1000"
                            />
                            <span className="text-sm opacity-70">{xpToNext} XP</span>
                        </div>
                    </div>

                    <div className="flex gap-6 mt-4 text-sm">
                        <div className="badge badge-outline gap-2">
                            <span>💰</span>
                            <span>{Math.floor(job!.baseReward * (1 + jobData.level * 0.1))} ₽</span>
                        </div>
                        <div className="badge badge-outline gap-2">
                            <span>⏱️</span>
                            <span>{job?.duration}s</span>
                        </div>
                        <div className="badge badge-outline gap-2">
                            <span>⭐</span>
                            <span>+100 XP</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                {pendingMission ? (
                    <ActiveMission mission={pendingMission} job={job!} onComplete={onCompleteMission} />
                ) : (
                    <div className="text-center">
                        <button type="button" onClick={onStartMission} className="btn btn-primary btn-lg">
                            Démarrer une mission
                        </button>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-4">Historique</h3>
                {missions.filter((m) => m.status === "completed").length === 0 ? (
                    <div className="alert">
                        <span>Aucune mission terminée</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {missions
                            .filter((m) => m.status === "completed")
                            .map((m) => (
                                <div key={m.id} className="card bg-base-100 shadow">
                                    <div className="card-body p-4 flex-row items-center gap-4">
                                        <span className="text-3xl">{JOBS[m.jobType]?.icon}</span>
                                        <div className="flex-1">
                                            <span className="font-bold">{JOBS[m.jobType]?.name}</span>
                                            <span className="text-xs opacity-60 ml-2">
                                                {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : ""}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <div className="badge badge-success">+{m.reward} ₽</div>
                                            <div className="badge badge-info">+100 XP</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function ActiveMission({
    mission,
    job,
    onComplete,
}: {
    mission: MissionData
    job: { duration: number; icon: string; name: string }
    onComplete: (id: string) => void
}) {
    const [timeLeft, setTimeLeft] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - mission.createdAt.getTime()
            const remaining = Math.max(0, job.duration * 1000 - elapsed)
            setTimeLeft(Math.ceil(remaining / 1000))

            if (remaining === 0) clearInterval(interval)
        }, 100)

        return () => clearInterval(interval)
    }, [mission, job])

    const progress = Math.min(100, ((Date.now() - mission.createdAt.getTime()) / (job.duration * 1000)) * 100)
    const canComplete = timeLeft === 0

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{job.icon}</div>
                    <div>
                        <h3 className="card-title">Mission en cours</h3>
                        <p className="opacity-70">{job.name}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold">Progression</span>
                        <span className="text-sm opacity-70">{timeLeft > 0 ? `${timeLeft}s` : "Terminé !"}</span>
                    </div>
                    <progress className="progress progress-success w-full" value={progress} max="100" />
                </div>

                <div className="card-actions justify-center">
                    <button
                        type="button"
                        onClick={() => onComplete(mission.id)}
                        disabled={!canComplete}
                        className="btn btn-success btn-wide"
                    >
                        {canComplete ? "Récupérer la récompense" : "En cours..."}
                    </button>
                </div>
            </div>
        </div>
    )
}
