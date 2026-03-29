import { Router, type IRouter } from "express";
import healthRouter from "./health";
import domainsRouter from "./domains";
import scenariosRouter from "./scenarios";
import threatsRouter from "./threats";
import agentsRouter from "./agents";
import chainsRouter from "./chains";
import sessionsRouter from "./sessions";
import reportsRouter from "./reports";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/domains", domainsRouter);
router.use("/scenarios", scenariosRouter);
router.use("/threats", threatsRouter);
router.use("/agents", agentsRouter);
router.use("/chains", chainsRouter);
router.use("/sessions", sessionsRouter);
router.use("/reports", reportsRouter);
router.use("/stats", statsRouter);

export default router;
