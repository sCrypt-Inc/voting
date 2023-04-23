// src/componetns/Footer.tsx

import React, { FC, ReactElement } from "react";
import { Box, Container, Grid, Link, Typography } from "@mui/material";

export const Footer: FC = (): ReactElement => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "auto",
        paddingTop: "1rem",
        paddingBottom: "1rem",
      }}
    >
      <Container maxWidth="lg">
        <Grid container direction="column" alignItems="center">
          <Grid item xs={12}>
            <Typography color="black" variant="h5">
                {`sCrypt, Inc.`}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Link   href="https://github.com/sCrypt-Inc/voting" target="_blank" variant="subtitle1">
             Github Repo
            </Link>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;