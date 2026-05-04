/* Filename: DesignSystem.js */
(() => {
  const { 
    Button, TextField, SelectField, ToggleField, CheckboxField, 
    Card, Badge, PageHeader, Tabs, CurrencyField, TextAreaField, RadioGroup, 
    Skeleton, EmptyState, StatCard, Timeline, Avatar, DropdownMenu, 
    ProgressBar, AttachmentManager, DatePicker, Stepper, TagInput, Spinner 
  } = window.DSCore || {};

  const { AdvancedFilter, DataGrid, LOVField } = window.DSGrid || {};

  const { HighlightText, Tree, TreeGrid } = window.DSTree || {};

  const { Modal, Tooltip, Alert, Toast, Banner, Dialog } = window.DSFeedback || {};

  const { Drawer, ContextMenu, Popover } = window.DSOverlays || {};

  const { BarChart, LineChart, DonutChart, PieChart, GaugeChart } = window.DSCharts || {};

  const DesignSystem = { 
    Button, 
    TextField, 
    SelectField, 
    ToggleField, 
    CheckboxField, 
    LOVField, 
    Card, 
    Badge, 
    PageHeader, 
    Modal, 
    AdvancedFilter, 
    AttachmentManager, 
    Tabs, 
    DataGrid, 
    HighlightText, 
    Tree, 
    TreeGrid,
    CurrencyField, 
    TextAreaField, 
    RadioGroup, 
    Tooltip, 
    Skeleton, 
    EmptyState, 
    StatCard, 
    Timeline, 
    Avatar, 
    DropdownMenu, 
    ProgressBar, 
    DatePicker, 
    Stepper, 
    TagInput, 
    Alert, 
    Toast, 
    Banner, 
    Dialog, 
    Spinner,
    Drawer,
    ContextMenu,
    Popover,
    BarChart,
    LineChart,
    DonutChart,
    PieChart,
    GaugeChart
  };

  window.DesignSystem = DesignSystem;
})();