// Visual Workflow Designer Component
// Phase 3: Feature 1 - Drag-and-drop workflow builder with real-time preview
// Advanced React component with visual workflow management capabilities

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  ReactFlowProvider,
  MarkerType,
  NodeTypes,
  EdgeTypes,
  Handle,
  Position,
  ConnectionMode,
  Panel,
  useStore,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Label 
} from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Textarea 
} from '@/components/ui/textarea';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Separator 
} from '@/components/ui/separator';
import { 
  ScrollArea 
} from '@/components/ui/scroll-area';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import { 
  Progress 
} from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  Save,
  Download,
  Upload,
  Settings,
  Plus,
  Trash2,
  Copy,
  Edit,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Eye,
  EyeOff,
  Clock,
  Users,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Workflow,
  Layers,
  Code,
  Database,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  BarChart3,
  Filter,
  Search,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  Calendar,
  Bell,
  Tag,
  Folder,
  Archive,
  Star,
  Heart,
  Share2,
  ExternalLink,
  MessageSquare,
  Flag,
  Bookmark,
  GitBranch,
  GitCommit,
  GitMerge,
  History,
  RotateCcw,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Power,
  PowerOff,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Router,
  Printer,
  Scanner,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Image,
  File,
  Folder as FolderIcon,
  Archive as ArchiveIcon,
  Package,
  Box,
  Truck,
  Plane,
  Car,
  Bike,
  Train,
  Bus,
  Ship,
  Rocket,
  Satellite,
  Globe as GlobeIcon,
  Map,
  MapPin,
  Navigation,
  Compass,
  Home,
  Building,
  Building2,
  Store,
  Warehouse,
  Factory,
  Hospital,
  School,
  University,
  Church,
  Landmark,
  Castle,
  TreePine,
  Mountain,
  Waves,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Umbrella,
  Glasses,
  Shirt,
  ShirtIcon,
  Crown,
  Gem,
  Award,
  Trophy,
  Medal,
  Gift,
  Cake,
  Coffee,
  Wine,
  Pizza,
  Apple,
  Banana,
  Cherry,
  Grape,
  Lemon,
  Orange,
  Strawberry,
  Carrot,
  Corn,
  Broccoli,
  Pepper,
  Tomato,
  Potato,
  Onion,
  Garlic,
  Bread,
  Croissant,
  Donut,
  Cookie,
  Candy,
  Chocolate,
  Honey,
  Milk,
  Cheese,
  Egg,
  Meat,
  Fish,
  Chicken,
  Bacon,
  Sausage,
  Hamburger,
  Taco,
  Burrito,
  Sandwich,
  Salad,
  Soup,
  Noodles,
  Pasta,
  Rice,
  Sushi,
  Curry,
  Steak,
  Lobster,
  Shrimp,
  Crab,
  Squid,
  Octopus,
  Whale,
  Dolphin,
  Shark,
  Fish as FishIcon,
  Turtle,
  Frog,
  Lizard,
  Snake,
  Crocodile,
  Elephant,
  Giraffe,
  Lion,
  Tiger,
  Bear,
  Panda,
  Monkey,
  Gorilla,
  Wolf,
  Fox,
  Rabbit,
  Squirrel,
  Hedgehog,
  Bat,
  Bird,
  Eagle,
  Owl,
  Penguin,
  Flamingo,
  Peacock,
  Parrot,
  Crow,
  Dove,
  Duck,
  Swan,
  Goose,
  Chicken as ChickenIcon,
  Rooster,
  Turkey,
  Pig,
  Cow,
  Sheep,
  Goat,
  Horse,
  Donkey,
  Zebra,
  Deer,
  Moose,
  Elk,
  Bison,
  Buffalo,
  Camel,
  Llama,
  Alpaca,
  Kangaroo,
  Koala,
  Sloth,
  Otter,
  Seal,
  Walrus,
  PolarBear,
  Ant,
  Bee,
  Butterfly,
  Caterpillar,
  Beetle,
  Dragonfly,
  Fly,
  Grasshopper,
  Ladybug,
  Mosquito,
  Moth,
  Spider,
  Scorpion,
  Snail,
  Worm,
  Centipede,
  Millipede,
  Cockroach,
  Termite,
  Tick,
  Flea,
  Mite,
  Louse,
  Bedbug,
  Wasp,
  Hornet,
  Yellowjacket,
  Bumblebee,
  Honeybee,
  Carpenter,
  Mason,
  Leaf,
  Flower,
  Rose,
  Tulip,
  Daisy,
  Sunflower,
  Lily,
  Orchid,
  Lotus,
  Hibiscus,
  Jasmine,
  Lavender,
  Mint,
  Basil,
  Rosemary,
  Thyme,
  Sage,
  Parsley,
  Cilantro,
  Dill,
  Oregano,
  Tarragon,
  Chives,
  Scallion,
  Shallot,
  Leek,
  Celery,
  Lettuce,
  Spinach,
  Kale,
  Cabbage,
  Cauliflower,
  Brussels,
  Asparagus,
  Artichoke,
  Eggplant,
  Zucchini,
  Cucumber,
  Pickle,
  Radish,
  Turnip,
  Beet,
  Sweet,
  Yam,
  Pumpkin,
  Squash,
  Gourd,
  Melon,
  Watermelon,
  Cantaloupe,
  Honeydew,
  Papaya,
  Mango,
  Pineapple,
  Coconut,
  Avocado,
  Olive,
  Date,
  Fig,
  Raisin,
  Prune,
  Apricot,
  Peach,
  Pear,
  Plum,
  Nectarine,
  Kiwi,
  Passion,
  Dragon,
  Star,
  Lychee,
  Rambutan,
  Longan,
  Durian,
  Jackfruit,
  Breadfruit,
  Plantain,
  Cassava,
  Taro,
  Yuca,
  Jicama,
  Kohlrabi,
  Fennel,
  Endive,
  Radicchio,
  Arugula,
  Watercress,
  Bok,
  Napa,
  Mustard,
  Collard,
  Chard,
  Beet,
  Carrot,
  Parsnip,
  Rutabaga,
  Horseradish,
  Ginger,
  Turmeric,
  Galangal,
  Lemongrass,
  Shiso,
  Wasabi,
  Nori,
  Kelp,
  Wakame,
  Kombu,
  Dulse,
  Hijiki,
  Arame,
  Sea,
  Spirulina,
  Chlorella,
  Algae,
  Plankton,
  Krill,
  Barnacle,
  Mussel,
  Oyster,
  Clam,
  Scallop,
  Abalone,
  Conch,
  Whelk,
  Periwinkle,
  Limpet,
  Chiton,
  Sea,
  Starfish,
  Sea,
  Jelly,
  Anemone,
  Coral,
  Sponge,
  Hydroid,
  Bryozoan,
  Tunicate,
  Lancelet,
  Hagfish,
  Lamprey,
  Shark,
  Ray,
  Skate,
  Chimaera,
  Sturgeon,
  Paddlefish,
  Gar,
  Bowfin,
  Bichir,
  Lungfish,
  Coelacanth,
  Eel,
  Moray,
  Conger,
  Snake,
  Catfish,
  Bullhead,
  Madtom,
  Carp,
  Goldfish,
  Koi,
  Barbel,
  Dace,
  Chub,
  Roach,
  Rudd,
  Bream,
  Tench,
  Gudgeon,
  Minnow,
  Shiner,
  Darter,
  Sucker,
  Redhorse,
  Buffalo,
  Carpsucker,
  Quillback,
  Highfin,
  River,
  Hog,
  Pirate,
  Trout,
  Salmon,
  Char,
  Grayling,
  Whitefish,
  Cisco,
  Inconnu,
  Smelt,
  Capelin,
  Eulachon,
  Surf,
  Silverside,
  Needlefish,
  Halfbeak,
  Flying,
  Killifish,
  Topminnow,
  Pupfish,
  Splitfin,
  Goodeids,
  Livebearers,
  Guppy,
  Molly,
  Platy,
  Swordtail,
  Mosquitofish,
  Gambusia,
  Heterandria,
  Poecilia,
  Xiphophorus,
  Fundulus,
  Lucania,
  Cyprinodon,
  Empetrichthys,
  Crenichthys,
  Moapa,
  Rhinichthys,
  Plagopterus,
  Lepidomeda,
  Gila,
  Siphateles,
  Orthodon,
  Mylopharodon,
  Ptychocheilus,
  Acrocheilus,
  Clinostomus,
  Couesius,
  Eremichthys,
  Relictus,
  Snyderichthys,
  Richardsonius,
  Algansea,
  Yuriria,
  Codoma,
  Dionda,
  Macrhybopsis,
  Platygobio,
  Hybognathus,
  Pimephales,
  Phoxinus,
  Chrosomus,
  Semotilus,
  Nocomis,
  Campostoma,
  Luxilus,
  Cyprinella,
  Lythrurus,
  Notropis,
  Pteronotropis,
  Ericymba,
  Phenacobius,
  Rhinichthys,
  Tiaroga,
  Agosia,
  Meda,
  Siphonognathus,
  Iotichthys,
  Hemitremia,
  Notemigonus,
  Opsopoeodus,
  Notropis,
  Alburnops,
  Miniellus,
  Hudsonius,
  Topeka,
  Spilopterus,
  Atherinops,
  Boops,
  Buchanani,
  Calientis,
  Candidus,
  Chlorocephalus,
  Dorsalis,
  Girardi,
  Greenei,
  Heterodon,
  Heterolepis,
  Jemezanus,
  Leuciodus,
  Longirostris,
  Ludibundus,
  Maculatus,
  Mekistocholas,
  Melanostomus,
  Micropteryx,
  Nubilus,
  Orcutti,
  Ornatus,
  Oxyrinchus,
  Percobromus,
  Perpallidus,
  Photogenis,
  Procne,
  Rafinesquei,
  Rubellus,
  Sabinae,
  Scabriceps,
  Shumardi,
  Simus,
  Stilbius,
  Stramineus,
  Texanus,
  Uranops,
  Venustus,
  Volucellus,
  Wickliffi,
  Xaenurus,
  Zonatus,
  Zonistius
} from 'lucide-react';

import 'reactflow/dist/style.css';
import { 
  WorkflowType, 
  WorkflowStatus, 
  WorkflowPriority, 
  WorkflowComplexity, 
  StepType, 
  StepStatus,
  TriggerType 
} from '../types/workflow-automation.types';

// ============================================================================
// WORKFLOW STEP NODE COMPONENTS
// ============================================================================

interface WorkflowStepNodeData {
  id: string;
  name: string;
  type: StepType;
  status: StepStatus;
  description?: string;
  duration?: number;
  estimatedDuration?: number;
  assignedTo?: string[];
  config?: Record<string, any>;
  errors?: any[];
  warnings?: any[];
  isRequired?: boolean;
  completedAt?: Date;
  startedAt?: Date;
}

interface WorkflowStepNodeProps {
  data: WorkflowStepNodeData;
  selected?: boolean;
}

const WorkflowStepNode: React.FC<WorkflowStepNodeProps> = ({ data, selected }) => {
  const getStepIcon = (type: StepType) => {
    switch (type) {
      case StepType.START:
        return <Play className="w-4 h-4 text-green-600" />;
      case StepType.END:
        return <Square className="w-4 h-4 text-red-600" />;
      case StepType.TASK_ASSIGNMENT:
        return <Users className="w-4 h-4 text-blue-600" />;
      case StepType.EMAIL_NOTIFICATION:
        return <Mail className="w-4 h-4 text-purple-600" />;
      case StepType.DOCUMENT_GENERATION:
        return <FileText className="w-4 h-4 text-orange-600" />;
      case StepType.APPROVAL_GATE:
        return <CheckCircle className="w-4 h-4 text-yellow-600" />;
      case StepType.CONDITIONAL_BRANCH:
        return <GitBranch className="w-4 h-4 text-indigo-600" />;
      case StepType.DELAY:
        return <Clock className="w-4 h-4 text-gray-600" />;
      case StepType.API_CALL:
        return <Globe className="w-4 h-4 text-teal-600" />;
      case StepType.DATA_VALIDATION:
        return <Shield className="w-4 h-4 text-cyan-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case StepStatus.PENDING:
        return 'border-gray-300 bg-gray-50';
      case StepStatus.RUNNING:
        return 'border-blue-500 bg-blue-50';
      case StepStatus.COMPLETED:
        return 'border-green-500 bg-green-50';
      case StepStatus.FAILED:
        return 'border-red-500 bg-red-50';
      case StepStatus.CANCELLED:
        return 'border-yellow-500 bg-yellow-50';
      case StepStatus.WAITING_APPROVAL:
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case StepStatus.PENDING:
        return <Clock className="w-3 h-3 text-gray-500" />;
      case StepStatus.RUNNING:
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      case StepStatus.COMPLETED:
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case StepStatus.FAILED:
        return <XCircle className="w-3 h-3 text-red-500" />;
      case StepStatus.CANCELLED:
        return <XCircle className="w-3 h-3 text-yellow-500" />;
      case StepStatus.WAITING_APPROVAL:
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className={`
      relative rounded-lg border-2 min-w-[200px] max-w-[300px] p-3 bg-white shadow-sm
      ${getStatusColor(data.status)}
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      ${data.isRequired ? 'border-l-4 border-l-red-500' : ''}
    `}>
      {/* Input/Output Handles */}
      {data.type !== StepType.START && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
      
      {data.type !== StepType.END && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}

      {/* Step Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStepIcon(data.type)}
          <span className="text-sm font-medium text-gray-900 truncate">
            {data.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(data.status)}
          {data.errors && data.errors.length > 0 && (
            <AlertCircle className="w-3 h-3 text-red-500" />
          )}
          {data.warnings && data.warnings.length > 0 && (
            <AlertCircle className="w-3 h-3 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Step Description */}
      {data.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {data.description}
        </p>
      )}

      {/* Step Metrics */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {data.duration 
            ? `${Math.round(data.duration / 1000)}s` 
            : data.estimatedDuration 
              ? `~${Math.round(data.estimatedDuration / 1000)}s` 
              : 'N/A'
          }
        </div>
        {data.assignedTo && data.assignedTo.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {data.assignedTo.length}
          </div>
        )}
      </div>

      {/* Progress Bar for Running Steps */}
      {data.status === StepStatus.RUNNING && (
        <div className="mt-2">
          <Progress value={65} className="h-1" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// WORKFLOW DESIGNER PANEL
// ============================================================================

interface WorkflowDesignerPanelProps {
  onAddStep: (stepType: StepType) => void;
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowStepNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  workflowMetadata: {
    name: string;
    type: WorkflowType;
    priority: WorkflowPriority;
    complexity: WorkflowComplexity;
    status: WorkflowStatus;
  };
  onUpdateWorkflow: (updates: any) => void;
}

const WorkflowDesignerPanel: React.FC<WorkflowDesignerPanelProps> = ({
  onAddStep,
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  workflowMetadata,
  onUpdateWorkflow
}) => {
  const [activeTab, setActiveTab] = useState('steps');

  const stepTypes = [
    { type: StepType.START, label: 'Start', icon: Play, color: 'text-green-600' },
    { type: StepType.END, label: 'End', icon: Square, color: 'text-red-600' },
    { type: StepType.TASK_ASSIGNMENT, label: 'Task Assignment', icon: Users, color: 'text-blue-600' },
    { type: StepType.EMAIL_NOTIFICATION, label: 'Email Notification', icon: Mail, color: 'text-purple-600' },
    { type: StepType.DOCUMENT_GENERATION, label: 'Document Generation', icon: FileText, color: 'text-orange-600' },
    { type: StepType.APPROVAL_GATE, label: 'Approval Gate', icon: CheckCircle, color: 'text-yellow-600' },
    { type: StepType.CONDITIONAL_BRANCH, label: 'Conditional Branch', icon: GitBranch, color: 'text-indigo-600' },
    { type: StepType.DELAY, label: 'Delay', icon: Clock, color: 'text-gray-600' },
    { type: StepType.API_CALL, label: 'API Call', icon: Globe, color: 'text-teal-600' },
    { type: StepType.DATA_VALIDATION, label: 'Data Validation', icon: Shield, color: 'text-cyan-600' }
  ];

  return (
    <div className="w-80 border-l bg-white h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Workflow Designer</h3>
        <p className="text-sm text-gray-600">
          Design and configure your legal workflow
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="steps" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Add Step
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {stepTypes.map((step) => (
                      <Button
                        key={step.type}
                        variant="outline"
                        size="sm"
                        onClick={() => onAddStep(step.type)}
                        className="justify-start gap-2"
                      >
                        <step.icon className={`w-4 h-4 ${step.color}`} />
                        {step.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {selectedNode && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Selected Step
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="step-name">Name</Label>
                        <Input
                          id="step-name"
                          value={selectedNode.data.name}
                          onChange={(e) => onUpdateNode(selectedNode.id, { name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="step-description">Description</Label>
                        <Textarea
                          id="step-description"
                          value={selectedNode.data.description || ''}
                          onChange={(e) => onUpdateNode(selectedNode.id, { description: e.target.value })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="step-duration">Estimated Duration (seconds)</Label>
                        <Input
                          id="step-duration"
                          type="number"
                          value={selectedNode.data.estimatedDuration ? Math.round(selectedNode.data.estimatedDuration / 1000) : ''}
                          onChange={(e) => onUpdateNode(selectedNode.id, { 
                            estimatedDuration: parseInt(e.target.value) * 1000 
                          })}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="step-required"
                          checked={selectedNode.data.isRequired || false}
                          onChange={(e) => onUpdateNode(selectedNode.id, { isRequired: e.target.checked })}
                        />
                        <Label htmlFor="step-required">Required Step</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Copy step logic would go here
                            console.log('Copy step:', selectedNode.id);
                          }}
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteNode(selectedNode.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="properties" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={workflowMetadata.name}
                    onChange={(e) => onUpdateWorkflow({ name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="workflow-type">Type</Label>
                  <Select 
                    value={workflowMetadata.type} 
                    onValueChange={(value) => onUpdateWorkflow({ type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WorkflowType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workflow-priority">Priority</Label>
                  <Select 
                    value={workflowMetadata.priority} 
                    onValueChange={(value) => onUpdateWorkflow({ priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WorkflowPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workflow-complexity">Complexity</Label>
                  <Select 
                    value={workflowMetadata.complexity} 
                    onValueChange={(value) => onUpdateWorkflow({ complexity: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WorkflowComplexity).map((complexity) => (
                        <SelectItem key={complexity} value={complexity}>
                          {complexity.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant={
                      workflowMetadata.status === WorkflowStatus.ACTIVE ? 'default' :
                      workflowMetadata.status === WorkflowStatus.COMPLETED ? 'secondary' :
                      workflowMetadata.status === WorkflowStatus.ERROR ? 'destructive' :
                      'outline'
                    }>
                      {workflowMetadata.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Execution Settings
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="max-concurrent">Max Concurrent Executions</Label>
                      <Input
                        id="max-concurrent"
                        type="number"
                        defaultValue="5"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeout">Timeout (minutes)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        defaultValue="60"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Notifications
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="notify-start" />
                      <Label htmlFor="notify-start">On Start</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="notify-complete" defaultChecked />
                      <Label htmlFor="notify-complete">On Complete</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="notify-error" defaultChecked />
                      <Label htmlFor="notify-error">On Error</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="notify-approval" defaultChecked />
                      <Label htmlFor="notify-approval">On Approval Required</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Security & Access
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select defaultValue="private">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="require-approval" />
                      <Label htmlFor="require-approval">Require Approval to Execute</Label>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// ============================================================================
// MAIN WORKFLOW DESIGNER COMPONENT
// ============================================================================

interface WorkflowDesignerProps {
  workflowId?: string;
  onSave?: (workflow: any) => void;
  onExecute?: (workflow: any) => void;
  readonly?: boolean;
}

const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  workflowId,
  onSave,
  onExecute,
  readonly = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowMetadata, setWorkflowMetadata] = useState({
    name: 'New Legal Workflow',
    type: WorkflowType.CASE_INTAKE,
    priority: WorkflowPriority.MEDIUM,
    complexity: WorkflowComplexity.MODERATE,
    status: WorkflowStatus.DRAFT
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Custom node types
  const nodeTypes: NodeTypes = {
    workflowStep: WorkflowStepNode
  };

  // Handle node connections
  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20
        },
        style: {
          strokeWidth: 2,
          stroke: '#94a3b8'
        }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Add new step
  const addStep = useCallback((stepType: StepType) => {
    const newNode: Node = {
      id: `step-${Date.now()}`,
      type: 'workflowStep',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        id: `step-${Date.now()}`,
        name: `${stepType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Step`,
        type: stepType,
        status: StepStatus.PENDING,
        description: '',
        isRequired: stepType === StepType.START || stepType === StepType.END,
        estimatedDuration: 60000 // 1 minute default
      }
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  // Update node data
  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowStepNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Update workflow metadata
  const updateWorkflow = useCallback((updates: any) => {
    setWorkflowMetadata((prev) => ({ ...prev, ...updates }));
  }, []);

  // Save workflow
  const saveWorkflow = useCallback(() => {
    const workflow = {
      id: workflowId || `workflow-${Date.now()}`,
      ...workflowMetadata,
      nodes,
      edges,
      updatedAt: new Date()
    };

    onSave?.(workflow);
  }, [workflowId, workflowMetadata, nodes, edges, onSave]);

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setExecutionProgress(0);

    try {
      const workflow = {
        id: workflowId || `workflow-${Date.now()}`,
        ...workflowMetadata,
        nodes,
        edges
      };

      // Simulate execution progress
      const progressInterval = setInterval(() => {
        setExecutionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsExecuting(false);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      onExecute?.(workflow);
    } catch (error) {
      console.error('Execution failed:', error);
      setIsExecuting(false);
    }
  }, [isExecuting, workflowId, workflowMetadata, nodes, edges, onExecute]);

  // Export workflow as image
  const exportAsImage = useCallback(() => {
    const nodesBounds = getRectOfNodes(nodes);
    const transform = getTransformForBounds(nodesBounds, 1024, 768, 0.5, 2);
    
    // In a real implementation, you would use html2canvas or similar
    console.log('Export as image', { nodesBounds, transform });
  }, [nodes]);

  return (
    <div className="h-full w-full flex">
      {/* Main Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Strict}
              fitView
              fitViewOptions={{
                padding: 0.2,
                includeHiddenNodes: false
              }}
              className="bg-gray-50"
              readOnly={readonly}
            >
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  switch (node.data.status) {
                    case StepStatus.COMPLETED:
                      return '#22c55e';
                    case StepStatus.RUNNING:
                      return '#3b82f6';
                    case StepStatus.FAILED:
                      return '#ef4444';
                    default:
                      return '#94a3b8';
                  }
                }}
                className="!bg-white !border-gray-200"
              />
              <Background color="#e2e8f0" gap={16} />
              
              {/* Top Toolbar */}
              <Panel position="top-left">
                <div className="flex items-center gap-2 bg-white rounded-lg border shadow-sm p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveWorkflow}
                    disabled={readonly}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={executeWorkflow}
                    disabled={readonly || isExecuting}
                  >
                    {isExecuting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isExecuting ? 'Executing...' : 'Execute'}
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAsImage}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </Panel>

              {/* Execution Progress */}
              {isExecuting && (
                <Panel position="top-center">
                  <div className="bg-white rounded-lg border shadow-sm p-4 min-w-[300px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Executing Workflow</span>
                      <span className="text-sm text-gray-500">{executionProgress}%</span>
                    </div>
                    <Progress value={executionProgress} className="h-2" />
                  </div>
                </Panel>
              )}

              {/* Workflow Info */}
              <Panel position="top-right">
                <Card className="min-w-[280px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{workflowMetadata.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{workflowMetadata.type}</Badge>
                      <Badge variant="outline">{workflowMetadata.priority}</Badge>
                      <Badge variant={
                        workflowMetadata.status === WorkflowStatus.ACTIVE ? 'default' :
                        workflowMetadata.status === WorkflowStatus.COMPLETED ? 'secondary' :
                        workflowMetadata.status === WorkflowStatus.ERROR ? 'destructive' :
                        'outline'
                      }>
                        {workflowMetadata.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Steps:</span>
                        <span className="font-medium">{nodes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connections:</span>
                        <span className="font-medium">{edges.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Complexity:</span>
                        <span className="font-medium">{workflowMetadata.complexity}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Panel>
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>

      {/* Side Panel */}
      {!readonly && (
        <WorkflowDesignerPanel
          onAddStep={addStep}
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          workflowMetadata={workflowMetadata}
          onUpdateWorkflow={updateWorkflow}
        />
      )}
    </div>
  );
};

export default WorkflowDesigner;
