import GrapesJS from 'grapesjs';
import gjsBasicBlocks from 'grapesjs-blocks-basic';
import gjsCustomCode from 'grapesjs-custom-code';
import gjsForms from 'grapesjs-plugin-forms';
import gjsPresetNewsletter from 'grapesjs-preset-newsletter';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import React, {ReactNode, useEffect, useState} from 'react';
import GBlock from '../GBlock';
// Components
import GComponent from '../GComponent';

export interface ISector {
  name: string;
  buildProps: string[];
}

export interface IStyleManager {
  sectors: ISector[];
}

export type GrapesPluginType = string | CallableFunction;

export interface IStorageManager {
  id: string;
  type?: string;
  autosave?: boolean;
  autoload?: boolean;
  stepBeforeSave?: number;
  urlStore?: string;
  urlLoad?: string;
  headers?: {
    [key: string]: any;
  };
}

interface IProps {
  id: string;
  // Preset and plugin options
  webpage: boolean;
  newsletter: boolean;
  plugins: GrapesPluginType[];
  // Components
  components: GComponent[];
  blocks: GBlock[];
  // Editor configurations
  storageManager: IStorageManager;
  blockManager: {};
  styleManager: IStyleManager;
  children?: ReactNode | ReactNode[];
  onInit?: (editor) => void;
  onDestroy?: (editor) => void;
}

function GEditor(props: IProps) {
  const {
    id,
    storageManager,
    blockManager,
    components,
    blocks,
    webpage,
    newsletter,
    children,
    onInit,
    onDestroy,
  } = props;

  const [editor, setEditor] = useState(null);

  useEffect(() => {
      if (!editor) {

        let plugins = [
          gjsBasicBlocks,
          gjsForms,
          gjsCustomCode,
          ...props.plugins,
        ];
        if (webpage) {
          plugins = [...plugins, gjsPresetWebpage];
        } else {
          if (newsletter) {
            plugins = [...plugins, gjsPresetNewsletter];
          }
        }

        const e = GrapesJS.init({
          blockManager,
          container: `#${id}`,
          fromElement: true,
          plugins,
          storageManager,
        });

        const defaultType = e.DomComponents.getType('default');
        const defaultModel = defaultType.model;
        const defaultView = defaultType.view;
        components.forEach((component: GComponent) => {
          e.DomComponents.addType(component.type, {
            model: defaultModel.extend(
              {
                defaults: Object.assign({}, defaultModel.prototype.defaults),
              },
              {
                isComponent: component.isComponent.bind(this),
              },
            ),
            view: defaultView.extend({
              events: {
                ...component.events,
              },
              render: component.render.bind(this),
            }),
          });
        });

        blocks.forEach((block: GBlock) => {
          e.BlockManager.add(block.id, block);
        });

        setEditor(e);
        if (onInit) {
          onInit(e);
        }
      } else {
        if (document) {
          document.getElementById(id).append(editor.render());
        }
      }

      return function cleanup() {
        if (editor) {
          if (onDestroy) {
            onDestroy(editor);
          }
          GrapesJS.editors = GrapesJS.editors.filter((e) => e !== editor);
          editor.destroy();
        }
      };
    },
    [
      blockManager,
      blocks,
      components,
      editor,
      id,
      newsletter,
      props,
      storageManager,
      webpage,
      onInit,
      onDestroy,
    ],
  );

  return (
    <div id={id}>
      {children}
    </div>
  );
}

GEditor.defaultProps = {
  blockManager: {},
  blocks: [],
  components: [],
  newsletter: false,
  plugins: [],
  storageManager: {},
  styleManager: {},
  webpage: false,
};

export default GEditor;

(window as any).GrapesJS = GrapesJS;
(window as any).grapesjs = GrapesJS;