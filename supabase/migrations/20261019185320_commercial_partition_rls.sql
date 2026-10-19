-- Deploy scoped server reads first. These policies also protect legacy partitions.
DROP POLICY server_access ON gymos.gym_states;
CREATE POLICY partition_runtime ON gymos.gym_states TO gymos_app
 USING(user_id=current_setting('app.gym_owner',true))
 WITH CHECK(user_id=current_setting('app.gym_owner',true));
DROP POLICY server_access ON gymos.gym_recovery;
CREATE POLICY partition_runtime ON gymos.gym_recovery TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true));
DROP POLICY server_access ON gymos.gym_access;
CREATE POLICY partition_runtime ON gymos.gym_access TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true));
DROP POLICY server_access ON gymos.gym_invites;
CREATE POLICY invitation_read ON gymos.gym_invites FOR SELECT TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true) OR token_hash=current_setting('app.invite_token',true));
CREATE POLICY invitation_write ON gymos.gym_invites FOR ALL TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true));
ALTER TABLE gymos.gym_states FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_recovery FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_access FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_invites FORCE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX activation_requests_unique_transfer ON gymos.activation_requests(upper(regexp_replace(transfer_ref,'[[:space:]]','','g')),currency) WHERE status='approved' AND transfer_ref IS NOT NULL;
