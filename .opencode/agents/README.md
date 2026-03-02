# OpenCode Custom Agents

This directory contains custom agents for OpenCode that provide specialized functionality for this project.

## Available Agents

### QA Tester (`@qa-tester`)

A specialized agent that performs automated browser testing using `agent-browser`.

**Purpose**: Automates end-to-end testing of web applications using a headless browser.

**Key Features**:
- Automated browser interactions (click, fill forms, navigate)
- Visual regression testing with screenshots
- Comprehensive test reporting with pass/fail status
- Bug detection and documentation
- Support for common test scenarios (auth, CRUD, forms, navigation)

#### Usage

You can invoke the QA tester agent in several ways:

1. **Direct mention**:
   ```
   @qa-tester please test the login flow on http://localhost:8081
   ```

2. **Automatic invocation** (OpenCode will use it when you ask for testing):
   ```
   Can you test the authentication flow?
   Run QA tests on the recipe import feature
   Verify the shopping cart functionality works correctly
   ```

#### Example Test Scenarios

**Test Login Flow**:
```
@qa-tester test the login flow using the test credentials:
- Email: test@example.com
- Password: password123
```

**Test Complete User Flow**:
```
@qa-tester test this user flow on http://localhost:8081:
1. Login with test credentials
2. Navigate to the pantry page
3. Add a new item
4. Verify the item appears in the list
5. Delete the item
6. Verify it's removed
```

**Test Form Validation**:
```
@qa-tester test the registration form validation:
- Test empty fields
- Test invalid email format
- Test password requirements
- Test successful registration
```

#### Prerequisites

The QA tester agent requires `agent-browser` to be installed:

```bash
npm install -g agent-browser
npx playwright install chromium
```

The agent will check for this automatically and install if needed.

#### Test Reports

The agent generates structured test reports that include:
- Test status (PASS/FAIL/PARTIAL)
- Individual test case results
- Screenshots of failures or key states
- Bug reports with reproduction steps
- Recommendations for improvements

#### Configuration

The agent is configured with:
- **Model**: Claude Sonnet 4 (for reliable test execution)
- **Temperature**: 0.1 (for consistent, deterministic testing)
- **Tools**: Bash and file reading enabled, editing disabled
- **Permissions**: Most bash commands allowed, destructive commands denied

## How Agent-Browser Works

Agent-browser is a CLI tool designed for AI-driven browser automation:

1. **Launch browser and navigate**:
   ```bash
   agent-browser open http://localhost:8081
   ```

2. **Get page snapshot** (returns refs for elements):
   ```bash
   agent-browser snapshot -i
   # Returns: @e1, @e2, @e3 for interactive elements
   ```

3. **Interact with elements**:
   ```bash
   agent-browser fill @e1 "test@example.com"
   agent-browser click @e3
   agent-browser press Enter
   ```

4. **Capture evidence**:
   ```bash
   agent-browser screenshot result.png
   ```

5. **Clean up**:
   ```bash
   agent-browser close
   ```

### Key Benefits

- **Ref-based selection**: More reliable than CSS selectors
- **Compact output**: Optimized for AI context windows
- **Fast**: Native Rust CLI with Node.js daemon
- **Persistent**: Browser stays open between commands

## Creating Your Own Agents

To create a new custom agent:

1. Create a new `.md` file in this directory:
   ```bash
   touch .opencode/agents/my-agent.md
   ```

2. Add frontmatter configuration:
   ```markdown
   ---
   description: What your agent does
   mode: subagent
   model: anthropic/claude-sonnet-4-20250514
   temperature: 0.3
   tools:
     write: false
     bash: true
   permission:
     bash:
       "*": ask
   ---
   
   Your agent's system prompt goes here...
   ```

3. Test your agent:
   ```
   @my-agent test command
   ```

### Agent Options

- **description**: Brief description (shown in autocomplete)
- **mode**: `primary` or `subagent`
- **model**: Override the default model
- **temperature**: Control randomness (0.0-1.0)
- **tools**: Enable/disable specific tools
- **permission**: Control what the agent can do
- **hidden**: Hide from autocomplete (subagents only)

## Best Practices

1. **Specialized agents**: Create agents for specific tasks
2. **Clear descriptions**: Help OpenCode know when to use each agent
3. **Appropriate permissions**: Grant only necessary tool access
4. **Temperature tuning**: Lower for deterministic tasks, higher for creative ones
5. **Documentation**: Include usage examples in the agent prompt

## Resources

- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)
- [Agent-Browser Documentation](https://agent-browser.dev/)
- [OpenCode Configuration](https://opencode.ai/docs/config/)

## Examples from This Project

### Testing the Login Flow

```
@qa-tester test the login functionality with these scenarios:

1. Valid credentials (test@example.com / password123)
2. Invalid email format
3. Wrong password
4. Empty fields

Take screenshots of any error messages.
```

### Testing Recipe Import

```
@qa-tester test the recipe import feature:

1. Login as test user
2. Navigate to recipes section
3. Test URL import with https://www.allrecipes.com/recipe/12345/
4. Verify recipe details are extracted correctly
5. Check that ingredients are properly parsed

Report any issues with the extraction.
```

### Complete User Journey Test

```
@qa-tester run a complete user journey test:

1. New user registration
2. Add items to pantry
3. Create a shopping list
4. Search for recipes
5. Add recipe to favorites
6. Log out and log back in
7. Verify data persistence

Generate a comprehensive report with screenshots at each step.
```

## Tips

- Use `@` to autocomplete available agents
- Agents can be chained (one agent can call another)
- Check `.opencode/agents/` for all available agents
- Agents inherit the primary agent's model unless overridden
- Use headed mode for debugging: Ask agent to use `--headed` flag
