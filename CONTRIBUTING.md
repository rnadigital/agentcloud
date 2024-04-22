# Contributing guide to agentcloud

Welcome, and thank you for choosing to contribute to the AgentCloud project.
The purpose of this document is to provide simple guidelines to help make your contribution process smoother.

## Before you get started ✋

There are many types of issues you can take on when contributing to the project "AgentCloud". We try our best to provide a wide array of open issues that vary in levels of complexity. From beginners to seasoned developers, everyone should be able to find something to work on.

## Developing AgentCloud

- [How Can I Contribute?](#how-can-i-contribute)
- [First let's find the perfect open issue for you.](#first-lets-find-the-perfect-open-issue-for-you)
  - [Join the community](#join-the-community)
- [🚨 Contributing best practices](#-contributing-best-practices)
- [How to contribute? 👨‍💻](#how-to-contribute-)
  - [Issue assignment](#issue-assignment)
  - [Fork and Pull Request Flow ⏳](#fork-and-pull-request-flow-)
- [Commit Message Format 💬](#commit-message-format-)
- [Keeping your Fork Up-to-Date 🆕](#keeping-your-fork-up-to-date-)
- [Opening PRs 📩](#opening-prs-)
- [Reviewing Pull Requests 🕵️](#reviewing-pull-requests-)
- [Reporting Bugs 🐛](#reporting-bugs-)
- [Suggesting Enhancements 🗣️](#suggesting-enhancements-)
- [Testing 🧪](#testing-)
- [License](#license)



## How Can I Contribute?

There are several ways to contribute to the project "AgentCloud". let's find out.

### First let's find the perfect open issue for you.

- If you are new to the project, please check out the [good first issue](https://github.com/rnadigital/agentcloud/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) label.
- If you are ready to make a big impact on the project, check out the [enhancement](https://github.com/rnadigital/agentcloud/labels/enhancement) that is being worked on and filter the issues by `"enhancement"` 
- If you are looking for something specific to work on, check out our [open issues](https://github.com/rnadigital/agentcloud/issues?q=is%3Aopen+is%3Aissue) and filter against the available labels such as `difficulty:high`, `priority:medium` etc.
- If you have an idea for a new feature, please open an issue, and we're open to discuss it.
- We are also happy to help you find something to work on. Just reach out to us in discord and send a message in "#feature-request" channel.


## 🚨 Contributing best practices
>  - Please `only work on one` issue at a time.
>  - If you're unable to continue with an assigned task, inform us promptly. 
>  - Ensure to `TEST` your feature contributions locally before requesting reviews. 
>  - Need assistance? Utilize the issue or start a discussion thread in our `✋help-and-support` channel on [Discord](https://discord.com/channels/1165866460745314304/1189711234682069042)
>  - While Generative AI is cool, minimize its use for `direct team communication`. We value concise, genuine exchanges over scripted messages.

### Join the community

- Join our [AgentCloud Discord Server](https://discord.gg/QFD7hcGCWn).
- Introduce yourself in the [`🎤|Introduce-yourself`](https://discord.com/channels/1165866460745314304/1168408021093859348) channel or open an issue to let us know that you are interested in contributing. let's connect.👋

## How to contribute? 👨‍💻


Following these steps will ensure that your contributions are well-received, reviewed, and integrated effectively into AgentCloud's codebase.

### Issue assignment
We don't have a formal process for assigning issues to contributors. We invite everyone to feel free to jump into any issues in this repo that they are able to help with. Our aim is to foster a collaborative environment where anyone can help without feeling burdened by an assigned task. We understand that life can sometimes present unexpected challenges, and we want to ensure that contributors don't feel pressured to complete assigned issues when they may have limited availability.

We also recognize that not having a formal process can sometimes lead to competing or duplicate PRs. There's no perfect solution here. We encourage everyone to communicate early and often on an Issue to indicate that they're actively working on it. If they see that an Issue already has a PR, try working with that author instead of drafting their own.

We review PRs in the order of their submission. We try to accept the earliest one that is closest to being ready to merge.

Assign yourself to the issue, if you are working on it (if you are not a member of the organization, please leave a comment on the issue and we will assign you to it.)

### Fork and Pull Request Flow ⏳

1. Head over to the [AgentCloud GitHub repo](https://github.com/rnadigital/agentcloud) and "fork it" into your own GitHub account.
2. Clone your fork to your local machine, using the following command:
```shell
git clone git@github.com:USERNAME/FORKED-PROJECT.git
```

3. Create a new branch based-off **\`develop\`** branch:
```shell
git checkout develop
git checkout -b github_userName/XXXX
```

4. Implement the changes or additions you intend to contribute. Whether it's **bug fixes**, **new features**, or **enhancements**, this is where you put your coding skills to use.

5. Once your changes are ready, you may then commit and push the changes from your working branch:
```shell
git commit -m "fix(xxxx-name_of_bug): nice commit description"
git push origin github_userName/XXXX
```

## Commit Message Format 💬

We require all commits in this repository to adhere to the following commit message format.

```
<type>: <description> (#<issue number>)

[optional body]
```

This format is based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Please refer to the Conventional Commits specification for more details.

## Keeping your Fork Up-to-Date 🆕
If you plan on doing anything more than just a small quick fix, you’ll want to **make sure you keep your fork up to date** by tracking the original ["upstream" repo](https://github.com/rnadigital/agentcloud) that you forked.

Follow the steps given below to do so:

1. Add the 'upstream' repo to list of remotes:
```shell
git remote add upstream https://github.com/rnadigital/agentcloud.git
```

2. Fetch upstream repo’s branches and latest commits:
```shell
git fetch upstream
```

3. Checkout to the **\`github_userName/XXXX\`** branch and merge the upstream:
```shell
git checkout github_userName/XXXX
git rebase upstream/main
```

**Now, your local 'github_userName/XXXX' branch is up-to-date with everything modified upstream!**

- Now it's time to create a pull request back to the upstream repository and follow the [pull request template](.github/pull_request_template.md) guidelines.
- Wait for a review and address any comments.

## Opening PRs 📩

1. Fork the repo and create your branch from `develop`.
2. As long as you are working on your PR, please mark it as a draft
3. Please make sure that your PR is up-to-date with the latest changes in `master`
4. Fill out the PR template
5. Mention the issue that your PR is addressing (closes: #<id>)
6. Make sure that your PR passes all checks
7. Keep pull requests small and focused, if you have multiple changes, please open multiple PRs
8. Make sure to test your changes
9. If you have multiple commits in your PR, that solve the same problem, please squash the commits

## Reviewing Pull Requests 🕵️

1. Be respectful and constructive
2. Assign yourself to the PR
3. Check if all checks are passing
4. Suggest changes instead of simply commenting on found issues
5. If you are unsure about something, ask the author
6. If you are not sure if the changes work, try them out
7. Reach out to other reviewers if you are unsure about something
8. If you are happy with the changes, approve the PR
9. If you've rights then merge the PR once it has all approvals and the checks are passing

## Reporting Bugs 🐛

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/rnadigital/agentcloud/issues).
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/rnadigital/agentcloud/issues/new).
- Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

## Suggesting Enhancements 🗣️

- Open a new issue with a clear title and detailed description about the enhancement you wish to see.
- Describe the current behavior and explain which behavior you expected to see instead and why.
- Include screenshots and videos which help demonstrate the steps or point you're making.

## Testing 🧪

> It's crucial to acknowledge the significance of various types of testing. Alongside conducting unit tests for your contributed code.
  
## License 

By contributing, you agree that your contributions will be licensed under the project's existing license, the GNU Affero General Public License, version 3 only.

