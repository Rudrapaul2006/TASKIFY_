export const Activity_Date = (dateStr) => {
    if (!dateStr) return "Earlier"

    let date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return "Earlier"

    let now = new Date()
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    let diffTime = today.getTime() - itemDay.getTime()
    let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) {
        return date.toLocaleDateString("en-US", { weekday: "long" })
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}
