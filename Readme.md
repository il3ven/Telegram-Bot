# Telegram Bot

## Features
### 1. /remind <time>
This command will remind you about any message you give.

Eg. /remind me after 30 mins or /remind me at 12:30 PM

### 2. /conf <time>
Similary as /remind but does not take a message as input. The replies are also different but the code is same.

### 3. Get regular stats about messages you have shared with the bot
This feature is mainly useful if the bot is added in any group. After fixed interval of time the bot will tell the number of messages that have been sent to the group since the last interval.

### 4. Use of database
The bot uses a mongodb database to schedule tasks and store number of messages in a conversation. The tasks can be sending of reminders or sending of message stats.

## Node packages used by the bot
### 1. Agenda
This is used to schedule tasks. The tasks are stored in an database so even if the bot shuts down it will resume the left over tasks.

### 2. Date.js
This library is internally used by agenda but is worth mentioning as it enables the bot to understand time in human language and schedule reminders accordingly.

Tested Commands : 
```
/remind me at 7th july 12:33am
/remind me tomorrow
/remind me tomorrow at 4:19pm
/remind me after 1 hour
/remind me at midnight
/remind me at 3pm tomorrow
/remind me in 10 secs
```

