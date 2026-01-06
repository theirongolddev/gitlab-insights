# Developer Experience Survey

**Purpose**: Understand developer workflows, identify common pain points, and discover opportunities to improve how we work.

**Estimated time**: 8-10 minutes
**Anonymity**: All responses are anonymous. Be honest - that's what helps us most.

---

## Survey Introduction

> We're trying to understand what's actually working and what's not in your day-to-day work. This isn't about evaluating anyone - it's about finding patterns and opportunities to make things better for everyone.
>
> Your honest feedback matters. There are no wrong answers.

---

## Section 1: About You

*These help us spot patterns across different roles/experience levels*

**Q1. What best describes your primary role?**
- [ ] Frontend Developer
- [ ] Backend Developer
- [ ] Full-Stack Developer
- [ ] DevOps / SRE / Platform Engineer
- [ ] Other: _______________

**Q2. How long have you been with this organization?**
- [ ] Less than 6 months
- [ ] 6 months - 1 year
- [ ] 1-2 years
- [ ] 2-5 years
- [ ] 5+ years

---

## Section 2: How You Spend Your Time

**Q3. On a typical day, what percentage of your time is spent on actual coding/implementation?**
- [ ] Less than 25%
- [ ] 25-50%
- [ ] 50-75%
- [ ] More than 75%

**Q4. How often do you find yourself doing work that feels like it should be someone else's responsibility?**

| | Never | Rarely | Sometimes | Often | Constantly |
|---|:---:|:---:|:---:|:---:|:---:|
| Figuring out unclear requirements | O | O | O | O | O |
| Getting stakeholder alignment/approval | O | O | O | O | O |
| Making design/UX decisions | O | O | O | O | O |
| Writing documentation that doesn't exist | O | O | O | O | O |
| Chasing down information from other teams | O | O | O | O | O |
| Finding out why something was built a certain way | O | O | O | O | O |

**Q5. What are your biggest time wasters? Select up to 3.**
- [ ] Waiting on code reviews
- [ ] Waiting on stakeholder decisions/approvals
- [ ] Unclear or changing requirements
- [ ] Meetings that could have been async
- [ ] Context switching between tasks
- [ ] Searching for information/documentation
- [ ] Debugging CI/CD pipeline issues
- [ ] Understanding unfamiliar code
- [ ] Environment/tooling setup issues
- [ ] Other: _______________

**Q6. What's one thing that should take 5 minutes but regularly takes an hour or more?** (Optional)

_[Open text field]_

---

## Section 3: Requirements & Clarity

**Q7. When you start working on a new task or feature, how clear are the requirements typically?**
- [ ] Crystal clear - I know exactly what to build
- [ ] Mostly clear - a few questions but generally good
- [ ] Hit or miss - varies a lot depending on the task/person
- [ ] Usually vague - I have to figure out a lot myself
- [ ] Almost never clear - significant discovery required

**Q8. How often do you have to go back and clarify requirements after you've started working?**
- [ ] Rarely (less than 10% of tasks)
- [ ] Sometimes (10-30% of tasks)
- [ ] Often (30-50% of tasks)
- [ ] Very often (more than 50% of tasks)

**Q9. When do you typically discover that requirements were incomplete or wrong?**
- [ ] During planning/before I start coding
- [ ] While I'm actively developing
- [ ] During code review
- [ ] After merge/in production
- [ ] Varies too much to say

**Q10. What information do you most often find yourself missing at the start of a task?**

_[Open text field]_

---

## Section 4: Code Review

**Q11. How long does a typical MR take from when you submit it to when it's merged?**
- [ ] Less than a few hours
- [ ] Same day
- [ ] 1-2 days
- [ ] 3-5 days
- [ ] More than a week

**Q12. How often do significant changes (not just code style, but feature or design changes) come up during code review?**
- [ ] Rarely - reviews are mostly minor feedback
- [ ] Sometimes - maybe 1 in 5 MRs
- [ ] Often - happens on most MRs
- [ ] Very often - major changes are the norm

**Q13. When you're reviewing someone else's code, do you have enough context to review effectively?**
- [ ] I don't do code reviews
- [ ] Almost always - I understand what it's for and why
- [ ] Usually - I can figure it out from the MR
- [ ] Sometimes - often have to ask questions or dig around
- [ ] Rarely - I'm often reviewing without full context

**Q14. What would help you give better code reviews?** (Optional)

_[Open text field]_

---

## Section 5: Pain Points

**Q15. Rate your level of frustration with each of these:**

| | Not frustrating | Mildly annoying | Moderately frustrating | Very frustrating | Major pain point |
|---|:---:|:---:|:---:|:---:|:---:|
| Finding information about why decisions were made | O | O | O | O | O |
| Understanding unfamiliar parts of the codebase | O | O | O | O | O |
| Code review turnaround time | O | O | O | O | O |
| Getting enough context to review others' code | O | O | O | O | O |
| CI/CD pipeline reliability | O | O | O | O | O |
| Knowing who to ask about something | O | O | O | O | O |
| Tracking what's happening across the team | O | O | O | O | O |
| Handoffs from design/product | O | O | O | O | O |
| Requirements changing during development | O | O | O | O | O |
| Requirements changing during code review | O | O | O | O | O |

**Q16. What's the most frustrating part of your day-to-day work?**

_[Open text field]_

---

## Section 6: GitLab & Information Needs

**Q17. What information do you wish GitLab made easier to find?** Select up to 3.
- [ ] Who's the expert on a specific area of code
- [ ] History/context on why code is the way it is
- [ ] What's blocking a release or milestone
- [ ] Team velocity and progress metrics
- [ ] Dependencies between projects/teams
- [ ] Recent changes to a specific area
- [ ] Review workload distribution
- [ ] Pipeline failure patterns and trends
- [ ] Other: _______________

**Q18. If you could ask any question about your codebase or team's work and get an instant answer, what would you ask?**

_[Open text field]_

---

## Section 7: Wrap-up

**Q19. If you could change one thing about how you work, what would have the biggest impact?**

_[Open text field]_

**Q20. Anything else we should know?** (Optional)

_[Open text field]_

---

## Survey Implementation Notes

### Recommended Platforms
- **Google Forms** - Free, easy to set up, good for small teams
- **Typeform** - Better UX, conversational feel matches our tone
- **SurveyMonkey** - More analytics features if needed
- **Notion** - If you're already using it for docs

### Distribution Tips

1. **Keep it anonymous** - Make this clear upfront and in the intro
2. **Set a deadline** - Give 1-2 weeks, send a reminder halfway through
3. **Share why it matters** - "We're using this to prioritize what to improve"
4. **Promise to share results** - "We'll share what we learned and what we're doing about it"
5. **Target 70%+ response rate** - For a team of 10-50, this is achievable with follow-up

### Analysis Framework

**Quantitative data:**
- Calculate averages for Likert scales
- Identify top 3 pain points by frequency
- Compare across roles and tenure
- Look for patterns in "biggest time wasters"
- Cross-reference Q9 (when gaps found) with Q12 (changes during review)

**Qualitative data:**
- Code responses by theme (e.g., "requirements," "code review," "tooling")
- Pull out specific quotes that capture common sentiments
- Note outliers - sometimes the best insights come from unique perspectives

**Key metrics to track:**
- % of time on coding vs other activities (Q3)
- Frequency of PM-like work (Q4)
- Requirements clarity distribution (Q7)
- When requirement gaps surface (Q9) - KEY METRIC
- MR cycle time (Q11)
- Frequency of review-stage changes (Q12) - KEY METRIC
- Reviewer context gaps (Q13)
- Top frustrations (Q15)
- What GitLab should surface (Q17)

**Hypothesis validation:**
- If Q9 shows gaps commonly found "during code review" AND Q12 shows changes "often" or "very often" during review, this validates the code review bottleneck hypothesis
- Cross-reference with Q11 (cycle time) to quantify impact

### Action Planning

After collecting responses:
1. Share high-level findings with the team (transparency builds trust)
2. Identify 2-3 highest-impact opportunities
3. Connect findings back to what GitLab data could help with
4. Plan small experiments before big investments

---

## Survey Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-06 | Initial version |
| 2.0 | 2025-01-06 | Added code review section, cut growth section, streamlined from 25 to 20 questions |
