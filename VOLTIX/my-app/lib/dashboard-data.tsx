import {
  Bell,
  Bookmark,
  BookOpen,
  Brush,
  Code,
  CuboidIcon,
  FileText,
  Grid,
  Home,
  ImageIcon,
  Layers,
  LayoutGrid,
  LifeBuoy,
  Users,
  Video,
  Download,
} from "lucide-react";

import type {
  App,
  CommunityPost,
  Project,
  RecentFile,
  SidebarItem,
  Tutorial,
} from "./dashboard-types";

export const apps: App[] = [
  {
    name: "PixelMaster",
    icon: <ImageIcon className="text-violet-500" />,
    description: "Advanced image editing and composition",
    category: "Creative",
    recent: true,
    new: false,
    progress: 100,
  },
  {
    name: "VectorPro",
    icon: <Brush className="text-orange-500" />,
    description: "Professional vector graphics creation",
    category: "Creative",
    recent: true,
    new: false,
    progress: 100,
  },
  {
    name: "VideoStudio",
    icon: <Video className="text-pink-500" />,
    description: "Cinematic video editing and production",
    category: "Video",
    recent: true,
    new: false,
    progress: 100,
  },
  {
    name: "UXFlow",
    icon: <LayoutGrid className="text-fuchsia-500" />,
    description: "Intuitive user experience design",
    category: "Design",
    recent: false,
    new: true,
    progress: 85,
  },
  {
    name: "WebCanvas",
    icon: <Code className="text-emerald-500" />,
    description: "Web design and development",
    category: "Web",
    recent: false,
    new: true,
    progress: 70,
  },
  {
    name: "3DStudio",
    icon: <CuboidIcon className="text-indigo-500" />,
    description: "3D modeling and rendering",
    category: "3D",
    recent: false,
    new: true,
    progress: 60,
  },
];

export const recentFiles: RecentFile[] = [
  {
    name: "Brand Redesign.pxm",
    app: "PixelMaster",
    modified: "2 hours ago",
    icon: <ImageIcon className="text-violet-500" />,
    shared: true,
    size: "24.5 MB",
    collaborators: 3,
  },
  {
    name: "Company Logo.vec",
    app: "VectorPro",
    modified: "Yesterday",
    icon: <Brush className="text-orange-500" />,
    shared: true,
    size: "8.2 MB",
    collaborators: 2,
  },
  {
    name: "Product Launch Video.vid",
    app: "VideoStudio",
    modified: "3 days ago",
    icon: <Video className="text-pink-500" />,
    shared: false,
    size: "1.2 GB",
    collaborators: 0,
  },
];

export const projects: Project[] = [
  {
    name: "Website Redesign",
    description: "Complete overhaul of company website",
    progress: 75,
    dueDate: "June 15, 2025",
    members: 4,
    files: 23,
  },
  {
    name: "Mobile App Launch",
    description: "Design and assets for new mobile application",
    progress: 60,
    dueDate: "July 30, 2025",
    members: 6,
    files: 42,
  },
  {
    name: "Brand Identity",
    description: "New brand guidelines and assets",
    progress: 90,
    dueDate: "May 25, 2025",
    members: 3,
    files: 18,
  },
];

export const tutorials: Tutorial[] = [
  {
    title: "Mastering Digital Illustration",
    description: "Learn advanced techniques for creating stunning digital art",
    duration: "1h 45m",
    level: "Advanced",
    instructor: "Sarah Chen",
    category: "Illustration",
    views: "24K",
  },
  {
    title: "UI/UX Design Fundamentals",
    description: "Essential principles for creating intuitive user interfaces",
    duration: "2h 20m",
    level: "Intermediate",
    instructor: "Michael Rodriguez",
    category: "Design",
    views: "56K",
  },
];

export const communityPosts: CommunityPost[] = [
  {
    title: "Minimalist Logo Design",
    author: "Alex Morgan",
    likes: 342,
    comments: 28,
    image: "/placeholder.svg?height=300&width=400",
    time: "2 days ago",
  },
  {
    title: "3D Character Concept",
    author: "Priya Sharma",
    likes: 518,
    comments: 47,
    image: "/placeholder.svg?height=300&width=400",
    time: "1 week ago",
  },
];

export const sidebarItems: SidebarItem[] = [
  {
    title: "Overview",
    icon: <Home className="h-4 w-4" />,
    url: "/dashboard",
    isActive: true,
  },
  {
    title: "Stations",
    icon: <Grid className="h-4 w-4" />,
    url: "/dashboard/stations",
  },
  {
    title: "Notifications",
    icon: <Bell className="h-4 w-4" />,
    url: "/dashboard/notifications",
  },
  {
    title: "Agents",
    icon: <Users className="h-4 w-4" />,
    items: [
      { title: "Mechanic", url: "/dashboard/agents/mechanic" },
      { title: "Traffic", url: "/dashboard/agents/traffic" },
      { title: "Logistics", url: "/dashboard/agents/logistics" },
      { title: "Energy", url: "/dashboard/agents/energy" },
      { title: "Supervisor", url: "/dashboard/agents/supervisor" },
    ],
  },
  {
    title: "Decisions",
    icon: <Layers className="h-4 w-4" />,
    items: [
      { title: "Live Feed", url: "/dashboard/decisions/live" },
      { title: "History", url: "/dashboard/decisions/history" },
    ],
  },
  {
    title: "Audit",
    icon: <FileText className="h-4 w-4" />,
    items: [{ title: "Blockchain", url: "/dashboard/audit/blockchain" }],
  },
  {
    title: "Support",
    icon: <LifeBuoy className="h-4 w-4" />,
    url: "/contact",
  },
  {
    title: "Settings",
    icon: <Bookmark className="h-4 w-4" />,
    url: "/dashboard/settings",
  },
  {
    title: "Download App",
    icon: <Download className="h-4 w-4" />,
    url: "/download",
  },
];
