export const Activity_Time = (dateStr) => {
    if (!dateStr) return ""

    let date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ""

    let now = new Date()
    let diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

    if (diffInSeconds < 60) return "just now"

    let diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
    }

    let diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours}h ago`
    }

    let diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
        return `${diffInDays}d ago`
    }

    let weeks = Math.floor(diffInDays / 7)
    if (weeks < 5) {
        return `${weeks}w ago`
    }

    let months = Math.floor(diffInDays / 30)
    if (months < 12) {
        return `${months}mo ago`
    }

    let years = Math.floor(diffInDays / 365)
    return `${years}y ago`
}
