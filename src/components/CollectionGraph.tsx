"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Collection, Source } from '@/lib/data/supabaseFunctions';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, X, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CollectionGraphProps {
  collections: Collection[];
  collectionSources: { [key: string]: Source[] };
}

interface NodeType {
  id: string;
  name: string;
  type: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  tags?: string[];
  content?: string;
}

export const CollectionGraph: React.FC<CollectionGraphProps> = ({ collections, collectionSources }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown>>();
  const [previousView, setPreviousView] = useState<{ x: number; y: number; k: number } | null>(null);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [activeKeywordSearch, setActiveKeywordSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<{
    x: number;
    y: number;
    data: any;
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const nodePositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [userInteractedSinceSelection, setUserInteractedSinceSelection] = useState(false);
  const [refocusTrigger, setRefocusTrigger] = useState<string | null>(null);
  const [hideTitles, setHideTitles] = useState(false);
  const [isRefocusing, setIsRefocusing] = useState(false);

  // Collection colors array
  const collectionColors = [
    '#FAE264', // Yellow
    '#F3AE3D', // Orange
    '#EA5850', // Red
    '#57BF80', // Green
    '#80C2C2', // Teal
    '#6286F7', // Blue
    '#9853D2'  // Purple
  ];

  // Get all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    Object.values(collectionSources).forEach(sources => {
      sources.forEach(source => {
        if (source.tags) {
          if (Array.isArray(source.tags)) {
            source.tags.forEach(tag => tags.add(tag));
          } else if (typeof source.tags === 'string') {
            try {
              const parsedTags = JSON.parse(source.tags);
              if (Array.isArray(parsedTags)) {
                parsedTags.forEach(tag => tags.add(tag));
              }
            } catch {
              source.tags.split(',').forEach(tag => tags.add(tag.trim()));
            }
          }
        }
      });
    });
    return Array.from(tags).sort();
  }, [collectionSources]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveKeywordSearch(keywordSearch);
    // Applying search filter shouldn't override programmatic centering
    // setUserInteractedSinceSelection(false); // Keep this false or based on user intent
  };

  // Handle click on node
  const handleNodeClick = (event: any, d: any) => {
    if (d.type === 'source') {
      // Deselect any selected collection first
      setSelectedCollection(null);

      // Store current view state before zooming
      const currentTransform = d3.zoomTransform(svgRef.current!);
      setPreviousView({
        x: currentTransform.x,
        y: currentTransform.y,
        k: currentTransform.k
      });

      // Get node data coordinates
      const nodeDataX = d.x;
      const nodeDataY = d.y;

      // Check if coordinates are valid and zoom is initialized
      if (nodeDataX !== undefined && nodeDataY !== undefined && zoomRef.current) {
        const panelWidth = 400; // Based on Tailwind class w-[400px]
        const svgWidth = dimensions.width;
        const svgHeight = dimensions.height;
        const visibleWidth = svgWidth - panelWidth;
        
        // Target coordinates on screen (75% across the visible area)
        const targetScreenX = (panelWidth + 3 * svgWidth) / 4;
        const targetScreenY = svgHeight / 2;
        
        const targetScale = 1.75; // Zoom level when focused

        // Calculate the required translation to center the node's data coordinates 
        // in the visible area at the target scale
        const targetTx = targetScreenX - targetScale * nodeDataX;
        const targetTy = targetScreenY - targetScale * nodeDataY;

        // Create the target zoom transform
        const targetTransform = d3.zoomIdentity.translate(targetTx, targetTy).scale(targetScale);

        // Animate to the target transform
        d3.select(svgRef.current)
          .transition()
          .duration(750) // Animation duration
          .call(zoomRef.current.transform, targetTransform);
      }

      const [x, y] = d3.pointer(event, svgRef.current);
      setSelectedSource({ x, y, data: d });
      setSelectedNodeId(d.id);
      setTimeout(() => setIsPanelVisible(true), 50);
      setUserInteractedSinceSelection(true); 
      setSelectedCollection(null);
      
      // Restore previous view if it exists
      if (previousView && zoomRef.current) {
        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity
            .translate(previousView.x, previousView.y)
            .scale(previousView.k)
          );
      }
    } else if (d.type === 'collection') {
      // Trigger the same logic as clicking the legend item
      handleLegendClick(d.id);
    }
  };

  // Handle click outside panel
  const handleBackgroundClick = (event: React.MouseEvent) => {
    // Always deselect collection when clicking background
    setSelectedCollection(null);

    if (selectedSource && event.target === svgRef.current) {
      setIsPanelVisible(false);
      
      // Restore previous view if it exists
      if (previousView && zoomRef.current) {
        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity
            .translate(previousView.x, previousView.y)
            .scale(previousView.k)
          );
      }
      
      setSelectedNodeId(null);
      setTimeout(() => setSelectedSource(null), 300);
    }
  };

  // Function to handle legend item click
  const handleLegendClick = useCallback((collectionId: string) => {
    const newSelectedCollection = selectedCollection === collectionId ? null : collectionId;
    setSelectedCollection(newSelectedCollection);
    setUserInteractedSinceSelection(false);
    setRefocusTrigger(newSelectedCollection);
  }, [selectedCollection]);

  // Effect to observe container size
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
        console.log(`Resized to: ${width} x ${height}`);
      }
    });

    if (containerRef.current) {
      setDimensions({ // Set initial dimensions
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Main graph rendering effect - now depends on dimensions
  useEffect(() => {
    // Add check for dimensions > 0
    if (!svgRef.current || collections.length === 0 || dimensions.width === 0 || dimensions.height === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();
    
    // Use state dimensions
    const { width, height } = dimensions; 
    console.log(`Rendering graph with dimensions: ${width}x${height}`);

    // Create the SVG container - use dynamic dimensions
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Create defs for gradients
    const defs = svg.append("defs");

    // Add background gradient
    const backgroundGradient = defs.append("linearGradient")
      .attr("id", "background-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", width)
      .attr("y2", height);

    backgroundGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#F8FFFB")
      .attr("stop-opacity", 0.95);

    backgroundGradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#F9FBFF")
      .attr("stop-opacity", 0.95);

    backgroundGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "white")
      .attr("stop-opacity", 0.95);

    // Add background rectangle
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#background-gradient)");

    // Initialize zoom behavior
    const zoom = d3.zoom<Element, unknown>()
      .scaleExtent([0.25, 2])
      .on("zoom", (event) => {
        const { transform } = event;
        setZoomLevel(transform.k);
        svg.selectAll("g").attr("transform", transform);
        // Only count as interaction if it's a user event AND we are not programmatically refocusing
        if (!isRefocusing && event.sourceEvent && event.sourceEvent.type !== 'api') {
          setUserInteractedSinceSelection(true);
          setRefocusTrigger(null); // Also clear trigger on manual interaction
        }
      });

    // Store zoom reference
    zoomRef.current = zoom;

    // Apply zoom behavior to SVG
    svg.call(zoom);

    // Prepare data for the graph
    const nodes: NodeType[] = [];
    const links: { source: string; target: string; value: number }[] = [];
    const sourceToCollectionMap = new Map<string, string[]>();
    const addedSourceIds = new Set<string>();

    // Add collection nodes
    collections.forEach(collection => {
      const node: NodeType = {
        id: collection.id,
        name: collection.name,
        type: 'collection',
        group: 0
      };
      
      // Restore previous position if it exists
      const prevPos = nodePositionsRef.current.get(collection.id);
      if (prevPos) {
        node.x = prevPos.x;
        node.y = prevPos.y;
        node.fx = prevPos.x; // Fix X position
        node.fy = prevPos.y; // Fix Y position
      }
      
      nodes.push(node);
    });

    // Process all sources first to build the source-to-collection map
    collections.forEach(collection => {
      const sources = collectionSources[collection.id] || [];
      sources.forEach(source => {
        // Add this collection to the source's collections array
        if (!sourceToCollectionMap.has(source.id)) {
          sourceToCollectionMap.set(source.id, [collection.id]);
        } else {
          sourceToCollectionMap.get(source.id)!.push(collection.id);
        }
      });
    });

    // Add source nodes and links
    collections.forEach(collection => {
      const sources = collectionSources[collection.id] || [];
      sources.forEach(source => {
        const sourceTags = Array.isArray(source.tags) 
          ? source.tags 
          : typeof source.tags === 'string'
            ? JSON.parse(source.tags)
            : [];

        const matchesKeyword = !activeKeywordSearch || 
          source.name.toLowerCase().includes(activeKeywordSearch.toLowerCase()) ||
          (source.content && source.content.toLowerCase().includes(activeKeywordSearch.toLowerCase()));

        if ((selectedTags.length === 0 || sourceTags.some(tag => selectedTags.includes(tag))) && matchesKeyword) {
          // Add source node only if it hasn't been added already
          if (!addedSourceIds.has(source.id)) {
            const sourceNode: NodeType = {
              id: source.id,
              name: source.name,
              type: 'source',
              group: 1,
              tags: sourceTags,
              content: source.content
            };

            // Restore previous position if it exists
            const prevPos = nodePositionsRef.current.get(source.id);
            if (prevPos) {
              sourceNode.x = prevPos.x;
              sourceNode.y = prevPos.y;
            }

            nodes.push(sourceNode);
            addedSourceIds.add(source.id);
          }

          // Create link from this collection to the source
          links.push({
            source: collection.id,
            target: source.id,
            value: 1
          });
        }
      });
    });

    // Find neighbors if a source is selected (use the full nodes array)
    const parentCollectionIds: string[] = [];
    const neighborIds = new Set<string>();
    if (selectedNodeId && !selectedCollection) {
      neighborIds.add(selectedNodeId);
      const collectionIdsForSource = sourceToCollectionMap.get(selectedNodeId) || [];
      collectionIdsForSource.forEach(collectionId => {
        neighborIds.add(collectionId);
        parentCollectionIds.push(collectionId);
      });
    }

    // Create a map of collection IDs to their colors
    const collectionColorMap = new Map();
    collections.forEach((collection, index) => {
      collectionColorMap.set(collection.id, collectionColors[index % collectionColors.length]);
    });

    // Create a simulation (use the full nodes array)
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100)
        .strength(0.3))
      .force("charge", d3.forceManyBody()
        .strength(-5))
      .force("center", d3.forceCenter(width / 2, height / 2)
        .strength(0.1))
      .force("collision", d3.forceCollide()
        .radius(30)
        .strength(0.2))
      .velocityDecay(0.4)
      .alphaDecay(0.05);

    // Add links (bind to links, data still relies on full nodes)
    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke-width", d => Math.sqrt(d.value))
      .style("opacity", (d: any) => {
        // d.source is the collection node object, d.target is the source node object
        const collectionNodeId = d.source.id;
        const sourceNodeId = d.target.id;

        if (isPanelVisible && selectedNodeId && !selectedCollection) {
          // Panel open: Show link if it connects selected source to any of its parent collections
          return neighborIds.has(collectionNodeId) && neighborIds.has(sourceNodeId) ? 0.6 : 0.05;
        } else if (selectedCollection) {
          // Collection selected: Show link if its collection end matches the selected one
          return collectionNodeId === selectedCollection ? 0.6 : 0.05;
        } else {
          // Default: Show all links (unless hidden by node opacity)
          return 0.6;
        }
      })
      .each(function(d: any) {
        // Get source and target colors
        const sourceNode = nodes.find(n => n.id === d.source.id);
        const targetNode = nodes.find(n => n.id === d.target.id);
        
        let sourceColor, targetColor;
        
        if (sourceNode?.type === 'collection') {
          sourceColor = collectionColorMap.get(sourceNode.id);
        } else if (sourceNode) {
          const sourceCollection = collections.find(collection => 
            collectionSources[collection.id]?.some(source => source.id === sourceNode.id)
          );
          sourceColor = sourceCollection ? collectionColorMap.get(sourceCollection.id) : '#999';
        }
        
        if (targetNode?.type === 'collection') {
          targetColor = collectionColorMap.get(targetNode.id);
        } else if (targetNode) {
          const targetCollection = collections.find(collection => 
            collectionSources[collection.id]?.some(source => source.id === targetNode.id)
          );
          targetColor = targetCollection ? collectionColorMap.get(targetCollection.id) : '#999';
        }
        
        if (sourceColor && targetColor && sourceColor !== targetColor) {
          // Create unique gradient ID
          const gradientId = `gradient-${d.source.id}-${d.target.id}`;
          
          // Create linear gradient
          const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientUnits", "userSpaceOnUse");
          
          // Add gradient stops
          gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", sourceColor);
          
          gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", targetColor);
          
          // Apply gradient to path
          d3.select(this).attr("stroke", `url(#${gradientId})`);
        } else if (sourceColor) {
          // Use solid color if source and target colors are the same or one is missing
          d3.select(this).attr("stroke", sourceColor);
        }
      });

    // Add labels (bind to full nodes array)
    const label = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.name)
      .attr("font-size", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .attr("dy", d => d.type === 'collection' ? 15 : 10)
      .style("opacity", d => {
        // Hide titles if the checkbox is checked
        if (hideTitles) {
          return 0;
        }
        if (isPanelVisible && selectedNodeId && !selectedCollection) {
          return neighborIds.has(d.id) ? 0.7 : 0.05;
        } else if (selectedCollection) {
          if (d.type === 'collection') {
            return d.id === selectedCollection ? 0.7 : 0.05;
          }
          const collectionIds = sourceToCollectionMap.get(d.id) || [];
          return collectionIds.includes(selectedCollection) ? 0.7 : 0.05;
        } else {
          return 0.7;
        }
      });

    // Add nodes (bind to full nodes array)
    const node = svg.append("g")
      .selectAll<SVGCircleElement, NodeType>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.type === 'collection' ? 10 : 5)
      .attr("fill", d => {
        if (d.type === 'collection') {
          return collectionColorMap.get(d.id);
        } else {
          const collectionIds = sourceToCollectionMap.get(d.id) || [];
          // Use the first collection's color as the fill
          return collectionIds.length > 0 ? collectionColorMap.get(collectionIds[0]) : '#999';
        }
      })
      .attr("stroke", d => {
        if (d.type === 'collection') {
          return "#fff";
        } else if (d.id === selectedNodeId) {
          return "#7F2A28";
        } else {
          return "none";
        }
      })
      .attr("stroke-width", d => {
        if (d.type === 'collection') {
          return 2;
        } else if (d.id === selectedNodeId) {
          return 2;
        } else {
          return 0;
        }
      })
      .style("opacity", d => {
        if (isPanelVisible && selectedNodeId && !selectedCollection) {
          return neighborIds.has(d.id) ? 1 : 0.05;
        } else if (selectedCollection) {
          if (d.type === 'collection') {
            return d.id === selectedCollection ? 1 : 0.05;
          }
          const collectionIds = sourceToCollectionMap.get(d.id) || [];
          return collectionIds.includes(selectedCollection) ? 1 : 0.05;
        } else {
          return 1;
        }
      })
      .on('mouseover', function(event, d) {
        if (d.type === 'collection') {
          const nodeElement = d3.select(this);
          nodeElement
            .attr("stroke", "#7F2A28")
            .attr("stroke-width", 2)
            .transition()
            .duration(1000)
            .ease(d3.easeSin)
            .attr("stroke-width", 3)
            .transition()
            .duration(1000)
            .ease(d3.easeSin)
            .attr("stroke-width", 2)
            .on("end", function() {
              if (nodeElement.attr("stroke") === "#7F2A28") {
                const pulse = () => {
                  nodeElement
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSin)
                    .attr("stroke-width", 3)
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSin)
                    .attr("stroke-width", 2)
                    .on("end", pulse);
                };
                pulse();
              }
            });
        } else if (d.id !== selectedNodeId) {
          d3.select(this)
            .attr("stroke", "#7F2A28")
            .attr("stroke-width", 2);
        }
      })
      .on('mouseout', function(event, d) {
        if (d.type === 'collection') {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        } else if (d.id !== selectedNodeId) {
          d3.select(this)
            .attr("stroke", "none");
        }
      })
      .on('click', handleNodeClick)
      .call(d3.drag<SVGCircleElement, NodeType>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add tooltips
    node.append("title")
      .text(d => `${d.name}\nType: ${d.type}\n${d.tags ? `Tags: ${d.tags.join(', ')}` : ''}`);

    // Update positions on each tick
    simulation.on("tick", () => {
      // Update links with curved paths and update gradient coordinates
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        
        // Update gradient coordinates
        const gradientId = `gradient-${d.source.id}-${d.target.id}`;
        const gradient = defs.select(`#${gradientId}`);
        if (!gradient.empty()) {
          gradient
            .attr("x1", d.source.x)
            .attr("y1", d.source.y)
            .attr("x2", d.target.x)
            .attr("y2", d.target.y);
        }
        
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      // Update labels
      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
        // Opacity is handled during initialization and updates based on state changes

      // Update nodes
      node
        .attr("cx", d => {
          nodePositionsRef.current.set(d.id, { x: d.x, y: d.y });
          return d.x;
        })
        .attr("cy", d => d.y);
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>) {
      if (!event.active) simulation.alphaTarget(0.1).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      // Dragging is a user interaction
      setUserInteractedSinceSelection(true); 
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep fx/fy null unless you want nodes to stay fixed after drag
      // event.subject.fx = null; 
      // event.subject.fy = null;
    }

    // Apply drag behavior
    node.call(d3.drag<SVGCircleElement, NodeType>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add tooltips (append to node selection)
    node.append("title")
      .text(d => `${d.name}\nType: ${d.type}\n${d.tags ? `Tags: ${d.tags.join(', ')}` : ''}`);
      
    // --- Refocus Logic --- 
    if (refocusTrigger && !userInteractedSinceSelection && zoomRef.current && !isRefocusing) {
      // Find the target collection node
      const targetNode = nodes.find(n => n.id === refocusTrigger && n.type === 'collection');

      if (targetNode) {
         // Get the node's position (prefer stored, fallback to current simulation position)
         const pos = nodePositionsRef.current.get(targetNode.id);
         let targetX = pos?.x ?? targetNode.x;
         let targetY = pos?.y ?? targetNode.y;

         // Ensure coordinates are valid before attempting to fix/focus
         if (targetX !== undefined && targetY !== undefined) {
             // Fix the node's position *before* calculating the transform and starting the animation
             targetNode.fx = targetX;
             targetNode.fy = targetY;

             // Indicate that a refocus animation is starting
             setIsRefocusing(true);

             // Use a slight delay to allow the fix to register and potentially let other nodes adjust briefly
             setTimeout(() => {
                 // Double check user hasn't interacted, trigger is still active, and we are meant to be refocusing
                 if (!userInteractedSinceSelection && refocusTrigger === targetNode.id && zoomRef.current && isRefocusing) { 
                    const targetScale = 1.5; // Fixed scale for collection focus
                    
                    // Calculate translation needed to center the *fixed* target node coordinates
                    const tx = width / 2 - targetScale * targetNode.fx!;
                    const ty = height / 2 - targetScale * targetNode.fy!;

                    // Create the target transform
                    const targetTransform = d3.zoomIdentity.translate(tx, ty).scale(targetScale);

                    // Animate the zoom
                    d3.select(svgRef.current)
                      .transition()
                      .duration(750)
                      .call(zoomRef.current.transform, targetTransform)
                      .on('end', () => {
                        // Release the fixed position *after* the animation completes
                        targetNode.fx = null;
                        targetNode.fy = null;
                        // Mark interaction as complete and refocusing finished
                        setUserInteractedSinceSelection(true); 
                        setIsRefocusing(false);
                      })
                      .on('interrupt', () => {
                        // If interrupted (e.g., by user scroll), release fix and refocus flag
                        targetNode.fx = null;
                        targetNode.fy = null;
                        setIsRefocusing(false);
                      });
                 } else {
                   // If conditions changed before animation started, release fix and refocus flag
                   targetNode.fx = null;
                   targetNode.fy = null;
                   setIsRefocusing(false);
                 }
                 // Clear the trigger after initiating focus or if conditions changed
                 setRefocusTrigger(null); 
             }, 50); // Short delay after fixing position
         } else {
            console.warn("Target node for refocus had undefined coordinates", targetNode.id);
            setRefocusTrigger(null); // Clear trigger if node has no coords
         }
      }
      else {
         // If target node wasn't found (e.g., filtered out), clear trigger
         setRefocusTrigger(null);
      }
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [collections, collectionSources, selectedTags, activeKeywordSearch, selectedCollection, userInteractedSinceSelection, dimensions, isPanelVisible, selectedNodeId, refocusTrigger, handleLegendClick, hideTitles, isRefocusing]);

  const handleZoomIn = () => {
    if (zoomLevel < 2 && zoomRef.current) {
      const newZoom = Math.min(zoomLevel + 0.2, 2);
      d3.select(svgRef.current)
        .transition()
        .duration(200)
        .call(zoomRef.current.scaleTo, newZoom);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.25 && zoomRef.current) {
      const newZoom = Math.max(zoomLevel - 0.2, 0.25);
      d3.select(svgRef.current)
        .transition()
        .duration(200)
        .call(zoomRef.current.scaleTo, newZoom);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef} 
        className="relative w-full h-[600px] border rounded-lg overflow-hidden"
        onClick={handleBackgroundClick}
      >
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-2 rounded border shadow-sm">
          <Checkbox 
            id="hide-titles"
            checked={hideTitles}
            onCheckedChange={(checked) => setHideTitles(checked as boolean)}
          />
          <Label htmlFor="hide-titles" className="text-xs font-normal text-[#444]">
            Hide Titles
          </Label>
        </div>
        {selectedSource && (
          <div 
            className={`absolute left-0 top-0 h-full w-[400px] bg-white border-r shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${isPanelVisible ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="h-full flex flex-col overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0 pr-4">
                    <h1 className="text-[22px] font-bold leading-tight break-words">{selectedSource.data.name}</h1>
                    <div className="text-[#666] uppercase text-sm tracking-wide mt-2 mb-3">
                      {selectedSource.data.type}
                    </div>
                    {selectedSource.data.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSource.data.tags?.map((tag: string) => (
                          <Badge 
                            key={tag} 
                            variant="outline"
                            className="bg-transparent text-[#666] border-[#ccc] rounded-full px-2 py-0.5 text-[0.7rem]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPanelVisible(false);
                      setSelectedNodeId(null);
                      setTimeout(() => setSelectedSource(null), 300);
                      // Optionally restore zoom here too if closing via button
                      if (previousView && zoomRef.current) {
                        d3.select(svgRef.current)
                          .transition()
                          .duration(750)
                          .call(zoomRef.current.transform, d3.zoomIdentity
                            .translate(previousView.x, previousView.y)
                            .scale(previousView.k)
                          );
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedSource.data.content && (
                  <div className="mb-8">
                    <p className="text-[0.7rem] leading-relaxed text-[#444]">
                      {selectedSource.data.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isTagPopoverOpen}
                className="w-[200px] justify-between bg-white rounded-none border-input text-sm text-muted-foreground font-normal h-9 px-3"
              >
                {selectedTags.length > 0
                  ? `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`
                  : "Select tags..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 rounded-none">
              <Command className="rounded-none">
                <CommandInput placeholder="Search tags..." className="h-9 rounded-none text-sm" />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {allTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        className="rounded-none"
                        onSelect={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag) 
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search titles and content..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              className="pl-8 bg-white w-64 rounded-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setActiveKeywordSearch(keywordSearch);
                }
              }}
            />
          </form>
        </div>
        <svg ref={svgRef} className="w-full h-full" />
        
        <div className="absolute bottom-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded border shadow-sm">
          <div className="text-[0.7rem] text-[#666] mb-1">Collections</div>
          <div className="space-y-1">
            {collections.map((collection, index) => (
              <div 
                key={collection.id} 
                className="flex items-center gap-2 cursor-pointer hover:bg-black/5 px-1 rounded transition-colors"
                onClick={() => handleLegendClick(collection.id)}
              >
                <div 
                  className={`w-3 h-3 rounded-full transition-opacity ${
                    selectedCollection && selectedCollection !== collection.id ? 'opacity-10' : 'opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: collectionColors[index % collectionColors.length] 
                  }} 
                />
                <span 
                  className={`text-[0.7rem] text-[#444] transition-opacity ${
                    selectedCollection && selectedCollection !== collection.id ? 'opacity-10' : 'opacity-100'
                  }`}
                >
                  {collection.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-white"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-white"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.25}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 