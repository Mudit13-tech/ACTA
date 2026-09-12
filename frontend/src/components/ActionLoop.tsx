import { IconCheck } from './Icons';
import type { Stage } from '../lib/types';

const CLASS: Record<Stage['status'], string> = {
  pending: 'loopstep--pending',
  active: 'loopstep--active',
  done: 'loopstep--done',
  blocked: 'loopstep--blocked',
  failed: 'loopstep--failed',
  skipped: 'loopstep--done',
};

/** The nine-step action loop, rendered as a vertical timeline. */
const ActionLoop = ({ stages, compact = false }: { stages: Stage[]; compact?: boolean }) => (
  <ol className="loop">
    {stages.map((stage, i) => (
      <li key={stage.id} className={`loopstep ${CLASS[stage.status]}`}>
        <div className="loopstep__rail">
          <span className="loopstep__bullet">
            {stage.status === 'done' || stage.status === 'skipped' ? (
              <IconCheck size={13} className="tick" />
            ) : (
              i + 1
            )}
          </span>
        </div>
        <div>
          <div className="row-between">
            <span className="loopstep__name">{stage.name}</span>
            {stage.status === 'skipped' && <span className="pill pill--auto">auto</span>}
            {stage.status === 'blocked' && <span className="pill pill--ask">waiting</span>}
            {stage.status === 'failed' && <span className="pill pill--block">stopped</span>}
          </div>
          {stage.note && <p className="loopstep__note">{stage.note}</p>}
          {!compact && stage.log.length > 0 && (
            <div className="loopstep__log">
              {stage.log.slice(-4).map((line, j) => (
                <span key={j}>{line}</span>
              ))}
            </div>
          )}
        </div>
      </li>
    ))}
  </ol>
);

export default ActionLoop;
