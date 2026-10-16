/**
 * ============================================================================
 *                    MAVELY - CONFIGURATION SETTINGS
 * ============================================================================
 */

export const CONFIG = {
  // Command Prefix for quick management commands (-close, -open)
  PREFIX: "-",

  // Top Banner Image (large header at top of panel & in tickets) - null until configured
  TOP_BANNER_URL: null,

  // Bottom Banner Image (thin blue accent strip below buttons) - null until configured
  BOTTOM_BANNER_URL: null,

  // Channel ID where closed ticket logs and transcripts are sent
  TRANSCRIPTS_CHANNEL_ID: "1548876816171798678",

  // Array of Role IDs permitted to view, claim, and manage tickets
  STAFF_ROLE_IDS: [],

  // Panel text content matching exact reference screenshot (no bullet dot)
  PANEL_TITLE: "Mavely Support",
  PANEL_DESCRIPTION:
    "> If you require support, we ask you to **open a ticket and our team will be ready to help**. Choose the category that matches your issue below and a private channel will be opened for you. Any trolling or rule violations will result in instant moderation towards your account.",

  // Support categories (General and Management)
  CATEGORIES: [
    {
      id: "general",
      label: "General",
      fullName: "General Support",
      categoryId: "1548331057911173140",
      categoryIds: ["1548331057911173140", "1548641572013215874"]
    },
    {
      id: "management",
      label: "Management",
      fullName: "Management Support",
      categoryId: "1548330987128229989",
      categoryIds: ["1548330987128229989", "1548641524722573352"]
    }
  ],

  // Rules text redesigned with blockquotes and clean headers
  RULES_CONTENT: {
    title: "MAVELY | TICKET CENTER",
    description: 
      "> Need help, want to report an issue, or have a question for our team? Select the ticket option that best matches your situation.\n" +
      "> Before opening a ticket, please read the information below carefully.\n\n" +
      "### TICKET GUIDELINES\n" +
      "> • Only open a ticket when you have a legitimate reason for doing so.\n" +
      "> • Please do not spam, troll, or intentionally misuse the ticket system.\n" +
      "> • Be respectful when speaking with our staff team. Disrespect, arguing, or unnecessary behavior may result in moderation action.\n\n" +
      "### RESPONSE REQUIREMENTS\n" +
      "> • Please respond to your ticket within 24 hours. Tickets with no response may be closed.\n" +
      "> • If your ticket requires a specific format, make sure to complete it after opening your ticket.\n" +
      "> • Provide clear and accurate information so our team can assist you properly.\n\n" +
      "### STAFF REPORTS\n" +
      "> • Staff reports should include valid evidence whenever possible.\n" +
      "> • Screenshots, recordings, logs, or reliable witnesses may be used as supporting evidence.\n" +
      "> • Reports without enough information may be closed by Internal Affairs or Management.\n\n" +
      "### IMPORTANT\n" +
      "> • Staff may take action depending on the circumstances of each situation.\n" +
      "> • Ticket decisions and punishments may vary based on the severity of the situation.\n" +
      "> • Please do not open multiple tickets for the same issue unless instructed by staff.\n" +
      "> • Ticket transcripts may be archived through our ticket system.\n\n" +
      "### MAVELY\n" +
      "> Ensure your ticket has a valid reason and provide all necessary details. Rule violations lead to moderation."
  },

  // ER:LC Live Session Information Settings
  SESSION: {
    API_KEY: process.env.ERLC_API_KEY || "",
    API_BASE: "https://api.erlc.gg/v1",
    TOP_BANNER_URL: null,
    BOTTOM_BANNER_URL: null,
    NOTIFICATION_ROLE_ID: "1548112626389618718",
    DEFAULT_JOIN_CODE: "liberty",
    DESCRIPTION:
      "> Mavely runs live, staff-supervised operations across Liberty County. Hop into the private server for structured patrols, realistic calls, and a respectful community atmosphere.",
    CHANNEL_ID: "1548147260297322496",
    INGAME_VC_ID: "1550318371340550254",
    QUEUE_VC_ID: "1550318480136470638",
    VOTE_TOP_BANNER_URL: null,
    VOTE_BOTTOM_BANNER_URL: null
  },

  // Staff Applications System Configuration
  APPLICATIONS: {
    TOP_BANNER_PATH: "./assets/applications_banner.png",
    REVIEW_CHANNEL_ID: "1550446015859925012",
    RESULTS_CHANNEL_ID: "1550413729013829725",
    TRAINING_CHANNEL_ID: "1548146597743960146",
    ARROW_LEFT_EMOJI_ID: "1550446757396348958",
    ARROW_RIGHT_EMOJI_ID: "1550446417376448593",
    COLOR: "#0a84fd"
  },

  // Welcome System Configuration
  WELCOME: {
    ENABLED: false, // Automatic join welcome DISABLED - beta panel is posted ONCE in BETA_CHANNEL_ID only
    SEND_DM: false, // NEVER DM the beta panel to users
    BETA_CHANNEL_ID: "1552532418727125002", // Private beta tester announcement channel
    CHANNEL_ID: "1552529223460061284", // #𝖮𝗇𝖻𝗈𝖺𝗋𝖽𝗂𝗇𝗀
    TICKET_CHANNEL_ID: "1552531450211991552", // #𝖭𝖾𝖾𝖽-𝗁𝖾𝗅𝗉
    NAVIGATE_CHANNEL_ID: "1544355964348801178",
    WELCOME_EMOJI: "<:Logo:1552544997612589056>",
    PEOPLE_EMOJI_ID: "1547025501703372820",
    PEOPLE_EMOJI_NAME: "People",
    SERVER_NAME: "Mavely"
  },

  // Departments System Configuration
  DEPARTMENTS: {
    ARROW_EMOJI: "<:Right_arrow:1550446417376448593>",
    TOP_BANNER_PATH: "./assets/department_banner.png",
    SERVER_NAME: "Mavely"
  }
};
