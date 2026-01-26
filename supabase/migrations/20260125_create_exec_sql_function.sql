-- Create a function to execute SQL dynamically (for admin/migration purposes)
-- WARNING: This function allows arbitrary SQL execution - use with caution!
-- Only grant execute permission to service_role or admin users

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Execute the query and return results
    -- Note: This is a simplified version - for complex queries, you may need to handle differently
    EXECUTE query;
    
    -- Return success message
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Query executed successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Grant execute permission (adjust as needed for your security requirements)
-- In production, restrict this to specific roles
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
